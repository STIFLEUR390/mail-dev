use mailin::response::{INVALID_CREDENTIALS, OK};
use mailin::{Action, AuthMechanism, Handler, Response, SessionBuilder};
use mailparse::body::Body;
use mailparse::*;
use std::io::{BufRead, Write};
use std::net::{IpAddr, Ipv4Addr, TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Clone, serde::Serialize, Debug)]
struct Payload {
  mime: String,
  headers: Vec<(String, String)>,
  text: String,
  html: String,
  from: String,
  to: String,
  message_id: String,
  subject: String,
  x_priority: String,
  attachments: Vec<Attachment>,
}

/// (filename, content_type, text_content, binary_content)
type Attachment = (String, String, Option<String>, Option<Vec<u8>>);

/// Tauri-managed state holding the running SMTP server (if any).
#[derive(Default)]
pub struct SmtpServerState {
  server: Mutex<Option<RunningServer>>,
}

struct RunningServer {
  shutdown: Arc<AtomicBool>,
  thread: Option<std::thread::JoinHandle<()>>,
}

#[derive(Clone, Debug)]
struct MyHandler<R: tauri::Runtime> {
  mime: Vec<Vec<u8>>,
  username: String,
  password: String,
  app: AppHandle<R>,
}

impl<R: tauri::Runtime> MyHandler<R> {
  fn new(app: AppHandle<R>, username: String, password: String) -> MyHandler<R> {
    MyHandler {
      mime: vec![],
      username,
      password,
      app,
    }
  }
}

impl<R: tauri::Runtime> Handler for MyHandler<R> {
  fn data(&mut self, buf: &[u8]) -> std::io::Result<()> {
    // Keep raw bytes: MIME bodies are not necessarily valid UTF-8 (8-bit MIME).
    self.mime.push(buf.to_vec());
    Ok(())
  }

  fn data_end(&mut self) -> Response {
    // Keep raw bytes: MIME bodies are not necessarily valid UTF-8 (8-bit MIME).
    // mailparse handles charset decoding from the Content-Type header.
    let raw = self.mime.concat();
    handle_incoming_mail(raw, &self.app);
    OK
  }

  fn auth_plain(
    &mut self,
    _authorization_id: &str,
    authentication_id: &str,
    password: &str,
  ) -> Response {
    if authentication_id == self.username && password == self.password {
      OK
    } else {
      INVALID_CREDENTIALS
    }
  }

  fn auth_login(&mut self, username: &str, password: &str) -> Response {
    if username == self.username && password == self.password {
      OK
    } else {
      INVALID_CREDENTIALS
    }
  }
}

// Core lifecycle logic, generic over the Tauri runtime so it can be exercised
// with `MockRuntime` in unit tests.
fn start_smtp_server_impl<R: tauri::Runtime>(
  app: AppHandle<R>,
  server: &Mutex<Option<RunningServer>>,
  address: String,
  username: String,
  password: String,
) -> String {
  let auth_enabled = !username.is_empty();

  let mut guard = match server.lock() {
    Ok(guard) => guard,
    Err(_) => return "SMTP state poisoned".to_string(),
  };
  if guard.is_some() {
    return format!("SMTP server is already running on {}", address);
  }

  let listener = match TcpListener::bind(&address) {
    Ok(listener) => listener,
    Err(error) => return format!("{}", error),
  };
  let localaddr = listener
    .local_addr()
    .map(|a| a.to_string())
    .unwrap_or_else(|_| address.clone());
  if let Err(error) = listener.set_nonblocking(true) {
    return format!("{}", error);
  }

  let shutdown = Arc::new(AtomicBool::new(false));
  let thread_shutdown = shutdown.clone();

  let thread = std::thread::spawn(move || {
    println!(
      "[smtp] server started on {} (auth: {})",
      localaddr,
      if auth_enabled { "required" } else { "off" }
    );
    // Non-blocking accept + poll loop so the server can be stopped cleanly.
    loop {
      if thread_shutdown.load(Ordering::Relaxed) {
        break;
      }
      match listener.accept() {
        Ok((stream, _peer)) => {
          let handler = MyHandler::new(app.clone(), username.clone(), password.clone());
          let auth = auth_enabled;
          std::thread::spawn(move || {
            if let Err(e) = handle_connection(stream, handler, auth) {
              eprintln!("[smtp] connection error: {:?}", e);
            }
          });
        }
        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
          std::thread::sleep(Duration::from_millis(50));
        }
        Err(e) => {
          if !thread_shutdown.load(Ordering::Relaxed) {
            eprintln!("[smtp] accept error: {}", e);
          }
          std::thread::sleep(Duration::from_millis(50));
        }
      }
    }
    println!("[smtp] server stopped on {}", localaddr);
  });

  *guard = Some(RunningServer {
    shutdown,
    thread: Some(thread),
  });
  "".to_string()
}

// Start the SMTP server.
// Binds to `address` (default 127.0.0.1:25). When `username` is non-empty,
// SMTP AUTH (PLAIN/LOGIN) is required for delivery.
// Returns "" on success, or an error message that the frontend can display.
#[tauri::command]
pub fn start_smtp_server(
  app: AppHandle,
  state: State<'_, SmtpServerState>,
  address: Option<String>,
  username: Option<String>,
  password: Option<String>,
) -> String {
  start_smtp_server_impl(
    app,
    &state.server,
    address.unwrap_or_else(|| "127.0.0.1:25".into()),
    username.unwrap_or_default(),
    password.unwrap_or_default(),
  )
}

// Stop the SMTP server. Returns "" on success, or an error message.
fn stop_smtp_server_impl(server: &Mutex<Option<RunningServer>>) -> String {
  let running = match server.lock() {
    Ok(mut guard) => guard.take(),
    Err(_) => return "SMTP state poisoned".to_string(),
  };
  match running {
    Some(running) => {
      running.shutdown.store(true, Ordering::Relaxed);
      if let Some(thread) = running.thread {
        // The accept loop polls every 50ms, so this returns promptly.
        let _ = thread.join();
      }
      "".to_string()
    }
    None => "SMTP server is not running".to_string(),
  }
}

#[tauri::command]
pub fn stop_smtp_server(state: State<'_, SmtpServerState>) -> String {
  stop_smtp_server_impl(&state.server)
}

fn handle_connection<R: tauri::Runtime>(
  mut stream: TcpStream,
  handler: MyHandler<R>,
  auth_enabled: bool,
) -> std::io::Result<()> {
  let client_addr: IpAddr = stream
    .peer_addr()
    .map(|a| a.ip())
    .unwrap_or(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)));

  let mut builder = SessionBuilder::new("localhost");
  if auth_enabled {
    builder
      .enable_auth(AuthMechanism::Plain)
      .enable_auth(AuthMechanism::Login)
      // Local testing server: allow AUTH without TLS (localhost only).
      .insecure_enable_plaintext_auth();
  }
  let mut session = builder.build(client_addr, handler);

  // Greeting
  let greeting = session.greeting();
  greeting.write_to(&mut stream)?;
  stream.flush()?;

  let mut reader = std::io::BufReader::new(stream.try_clone()?);
  let mut line = Vec::with_capacity(80);
  loop {
    line.clear();
    let num_bytes = reader.read_until(b'\n', &mut line)?;
    if num_bytes == 0 {
      break;
    }
    let res = session.process(&line);
    match res.action {
      Action::Reply => {
        res.write_to(&mut stream)?;
        stream.flush()?;
      }
      Action::Close => {
        res.write_to(&mut stream)?;
        stream.flush()?;
        return Ok(());
      }
      Action::UpgradeTls => {
        // No TLS support in this server; close the connection.
        res.write_to(&mut stream)?;
        stream.flush()?;
        return Ok(());
      }
      Action::NoReply => (),
    }
  }
  Ok(())
}

// Parse the mail content and emit it to the webview. Never panics on bad input.
fn handle_incoming_mail<R: tauri::Runtime>(raw: Vec<u8>, app: &AppHandle<R>) {
  match parse_mail_payload(&raw) {
    Ok(payload) => {
      if let Some(win) = app.get_webview_window("main")
        && let Err(e) = win.emit("mail-received", payload)
      {
        eprintln!("[smtp] failed to emit mail-received: {}", e);
      }
    }
    Err(e) => eprintln!("[smtp] failed to parse incoming mail: {}", e),
  }
}

// Pure parsing logic, extracted so it can be unit-tested without a Tauri runtime.
fn parse_mail_payload(mime: &[u8]) -> Result<Payload, String> {
  let mut payload = Payload {
    mime: String::from_utf8_lossy(mime).into_owned(),
    headers: vec![],
    subject: "".to_string(),
    from: "".to_string(),
    to: "".to_string(),
    message_id: "".to_string(),
    x_priority: "".to_string(),
    text: "".to_string(),
    html: "".to_string(),
    attachments: vec![],
  };

  let parsed = parse_mail(mime).map_err(|e| format!("invalid MIME: {}", e))?;

  for header in parsed.headers.iter() {
    payload.headers.push((header.get_key(), header.get_value()));
    match header.get_key().as_str() {
      "Subject" => payload.subject = header.get_value(),
      "From" => payload.from = header.get_value(),
      "To" => payload.to = header.get_value(),
      "Message-ID" => payload.message_id = header.get_value(),
      "X-Priority" => payload.x_priority = header.get_value(),
      _ => {}
    }
  }

  extract_parts(parsed, &mut payload);

  Ok(payload)
}

fn extract_parts(parsed: ParsedMail, payload: &mut Payload) {
  if !parsed.subparts.is_empty() {
    for subpart in parsed.subparts {
      extract_parts(subpart, payload);
    }
    return;
  }

  match parsed.get_content_disposition().disposition {
    DispositionType::Inline => {
      if parsed.ctype.mimetype == "text/plain" {
        payload.text = parsed.get_body().unwrap_or_default();
      } else {
        payload.html = parsed.get_body().unwrap_or_default();
      }
    }
    DispositionType::Attachment => {
      let filename = parsed
        .get_content_disposition()
        .params
        .get("filename")
        .cloned()
        .unwrap_or_else(|| "attachment.bin".to_string());

      let content_type = {
        let mut content_type = String::new();
        for header in parsed.get_headers() {
          if header.get_key() == "Content-Type" {
            content_type = header.get_value();
          }
        }
        content_type
      };

      match parsed.get_body_encoded() {
        Body::Base64(body) => match body.get_decoded() {
          Ok(binary) => payload
            .attachments
            .push((filename, content_type, None, Some(binary))),
          Err(e) => eprintln!("[smtp] failed to decode attachment '{}': {}", filename, e),
        },
        _ => {
          let text = parsed.get_body().unwrap_or_default();
          payload
            .attachments
            .push((filename, content_type, Some(text), None));
        }
      }
    }
    _ => {}
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const SIMPLE_MAIL: &str = "From: sender@example.com\r\n\
To: rcpt@example.com\r\n\
Subject: Hello\r\n\
Message-ID: <abc@example.com>\r\n\
X-Priority: 3\r\n\
\r\n\
Hello world!";

  const MULTIPART_MAIL: &str = "From: sender@example.com\r\n\
To: rcpt@example.com\r\n\
Subject: Multi\r\n\
MIME-Version: 1.0\r\n\
Content-Type: multipart/mixed; boundary=\"BOUND\"\r\n\
\r\n\
--BOUND\r\n\
Content-Type: text/plain\r\n\
\r\n\
Body text\r\n\
--BOUND\r\n\
Content-Type: text/html\r\n\
\r\n\
<b>Body</b>\r\n\
--BOUND\r\n\
Content-Type: application/octet-stream; name=\"data.bin\"\r\n\
Content-Disposition: attachment; filename=\"data.bin\"\r\n\
Content-Transfer-Encoding: base64\r\n\
\r\n\
AAECAw==\r\n\
--BOUND--\r\n";

  #[test]
  fn parses_simple_mail() {
    let payload = parse_mail_payload(SIMPLE_MAIL.as_bytes()).expect("simple mail should parse");
    assert_eq!(payload.subject, "Hello");
    assert_eq!(payload.from, "sender@example.com");
    assert_eq!(payload.to, "rcpt@example.com");
    assert_eq!(payload.message_id, "<abc@example.com>");
    assert_eq!(payload.x_priority, "3");
    assert_eq!(payload.text, "Hello world!");
    assert!(payload.attachments.is_empty());
  }

  #[test]
  fn parses_multipart_with_attachment() {
    let payload =
      parse_mail_payload(MULTIPART_MAIL.as_bytes()).expect("multipart mail should parse");
    assert_eq!(payload.subject, "Multi");
    assert_eq!(payload.text, "Body text");
    assert!(payload.html.contains("<b>Body</b>"));
    assert_eq!(payload.attachments.len(), 1);
    let (name, ctype, text, binary) = &payload.attachments[0];
    assert_eq!(name, "data.bin");
    assert!(ctype.contains("octet-stream"));
    assert!(text.is_none());
    assert_eq!(binary.as_deref(), Some(&[0x00, 0x01, 0x02, 0x03][..]));
  }

  #[test]
  fn attachment_without_filename_does_not_panic() {
    let mail = "From: a@b.c\r\n\
To: d@e.f\r\n\
Subject: no name\r\n\
MIME-Version: 1.0\r\n\
Content-Type: multipart/mixed; boundary=\"B\"\r\n\
\r\n\
--B\r\n\
Content-Type: application/octet-stream\r\n\
Content-Disposition: attachment\r\n\
Content-Transfer-Encoding: base64\r\n\
\r\n\
AAECAw==\r\n\
--B--\r\n";
    let payload = parse_mail_payload(mail.as_bytes()).expect("should not panic");
    assert_eq!(payload.attachments.len(), 1);
    assert_eq!(payload.attachments[0].0, "attachment.bin");
  }

  #[test]
  fn iso_8859_1_body_is_decoded_with_charset() {
    // "caf\xE9" is valid ISO-8859-1 but not UTF-8; mailparse must use the
    // declared charset instead of panicking.
    let raw = b"From: a@b.c\r\nTo: d@e.f\r\nSubject: latin\r\nContent-Type: text/plain; charset=iso-8859-1\r\n\r\ncaf\xE9";
    let payload = parse_mail_payload(raw).expect("should not panic");
    assert_eq!(payload.text, "caf\u{00E9}"); // "café"
  }

  #[test]
  fn non_utf8_body_does_not_panic() {
    // No charset declared: decoding falls back to a safe default, never panics.
    let raw = b"From: a@b.c\r\nTo: d@e.f\r\nSubject: latin\r\n\r\ncaf\xE9";
    let payload = parse_mail_payload(raw).expect("should not panic");
    assert!(payload.text.contains("caf"));
  }

  #[test]
  fn garbage_input_does_not_panic() {
    // parse_mail is lenient; the important thing is that this never panics.
    let _ = parse_mail_payload(b"not really a mime message").expect("should not panic");
  }

  #[test]
  fn smtp_server_lifecycle_roundtrip() {
    use std::io::{BufRead, BufReader, Write};
    use std::net::TcpStream;
    use std::time::Duration;

    let app = tauri::test::mock_builder()
      .manage(SmtpServerState::default())
      .build(tauri::test::mock_context(tauri::test::noop_assets()))
      .expect("mock app should build");
    let state = app.state::<SmtpServerState>();
    let address = "127.0.0.1:25252".to_string();

    // Start succeeds.
    let result = start_smtp_server_impl(
      app.handle().clone(),
      &state.server,
      address.clone(),
      String::new(),
      String::new(),
    );
    assert_eq!(result, "", "start should succeed");

    // A second start is rejected while running.
    let again = start_smtp_server_impl(
      app.handle().clone(),
      &state.server,
      address.clone(),
      String::new(),
      String::new(),
    );
    assert!(!again.is_empty(), "second start should be rejected");

    // Drive a real SMTP conversation over TCP.
    let mut stream = TcpStream::connect(&address).expect("connect to smtp server");
    stream
      .set_read_timeout(Some(Duration::from_secs(5)))
      .unwrap();
    let mut reader = BufReader::new(stream.try_clone().unwrap());
    let mut line = String::new();
    reader.read_line(&mut line).expect("greeting");
    assert!(line.starts_with("220"), "greeting: {}", line);

    let mut send = |cmd: &str| {
      stream.write_all(cmd.as_bytes()).expect("write");
      stream.flush().expect("flush");
    };
    let mut read = || {
      // Drain multi-line replies (continuation lines start with "250-").
      loop {
        line.clear();
        reader.read_line(&mut line).expect("read");
        if !line.starts_with("250-") && !line.starts_with("220-") {
          return line.clone();
        }
      }
    };

    send("EHLO tester\r\n");
    assert!(read().starts_with("250"), "{} ", read());
    send("MAIL FROM:<a@b.c>\r\n");
    assert!(read().starts_with("250"));
    send("RCPT TO:<d@e.f>\r\n");
    assert!(read().starts_with("250"));
    send("DATA\r\n");
    assert!(read().starts_with("354"));
    send("Subject: Lifecycle test\r\n\r\nHello from the lifecycle test!\r\n.\r\n");
    assert!(read().starts_with("250"), "{} ", read());
    send("QUIT\r\n");
    assert!(read().starts_with("221"));

    // Stop succeeds and closes the port.
    let stop_result = stop_smtp_server_impl(&state.server);
    assert_eq!(stop_result, "", "stop should succeed");
    assert!(
      TcpStream::connect(&address).is_err(),
      "connection should be refused after stop"
    );
  }
}
