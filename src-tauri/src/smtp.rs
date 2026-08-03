use crate::window;
use mailin::{Action, AuthMechanism, Handler, Response, SessionBuilder};
use mailin::response::{INVALID_CREDENTIALS, OK};
use mailparse::body::Body;
use mailparse::*;
use std::io::{BufRead, Write};
use std::net::{IpAddr, Ipv4Addr, TcpListener, TcpStream};
use tauri::Emitter;

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
  attachments: Vec<(String, String, Option<String>, Option<Vec<u8>>)>,
}

#[derive(Clone, Debug)]
struct MyHandler {
  mime: Vec<String>,
  username: String,
  password: String,
}

impl MyHandler {
  pub fn new(username: String, password: String) -> MyHandler {
    MyHandler {
      mime: vec![],
      username,
      password,
    }
  }
}

impl Handler for MyHandler {
  fn data(&mut self, buf: &[u8]) -> std::io::Result<()> {
    self.mime.push(String::from_utf8(Vec::from(buf)).unwrap());
    Ok(())
  }

  fn data_end(&mut self) -> Response {
    let mime = self.mime.join("");
    self::parse(mime);
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

// Start the SMTP server
// bind to custom port, fallback to 25.
// When `username` is non-empty, SMTP AUTH (PLAIN/LOGIN) is required for delivery.
#[tauri::command]
pub async fn start_smtp_server(
  address: Option<String>,
  username: Option<String>,
  password: Option<String>,
) -> String {
  let address = address.unwrap_or_else(|| "127.0.0.1:25".into());
  let username = username.unwrap_or_default();
  let password = password.unwrap_or_default();
  let auth_enabled = !username.is_empty();

  match TcpListener::bind(&address) {
    Ok(listener) => {
      std::thread::spawn(move || {
        let localaddr = listener.local_addr().unwrap();
        println!("SMTP server started on {}", localaddr);
        for stream in listener.incoming() {
          match stream {
            Ok(stream) => {
              let handler = MyHandler::new(username.clone(), password.clone());
              std::thread::spawn(move || {
                if let Err(e) = handle_connection(stream, handler, auth_enabled) {
                  println!("SMTP connection error: {:?}", e);
                }
              });
            }
            Err(e) => println!("SMTP connection failed: {}", e),
          }
        }
      });
      "".to_string()
    }
    Err(error) => format!("{}", error),
  }
}

fn handle_connection(
  mut stream: TcpStream,
  handler: MyHandler,
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

// Parse the mail content and send it to the webview
pub fn parse(mime: String) {
  let mut payload = Payload {
    mime: mime.clone(),
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

  let parsed = parse_mail(mime.as_ref()).unwrap();
  // println!("{:?}", parsed);

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

  let mut add_body_part = |x: ParsedMail| {
    match x.get_content_disposition().disposition {
      DispositionType::Inline => {
        if x.ctype.mimetype == "text/plain" {
          payload.text = x.get_body().unwrap();
        } else {
          payload.html = x.get_body().unwrap();
        }
      }
      DispositionType::Attachment => {
        let filename = x
          .get_content_disposition()
          .params
          .get("filename")
          .unwrap()
          .to_owned();

        let mut content_type: String = String::new();
        for header in x.get_headers() {
          if header.get_key() == "Content-Type" {
            content_type = header.get_value()
          }
        }

        match x.get_body_encoded() {
          Body::Base64(body) => {
            let binary = body.get_decoded().unwrap();
            payload
              .attachments
              .push((filename, content_type, None, Some(binary)));
          }
          _ => {
            let text = x.get_body().unwrap();
            payload
              .attachments
              .push((filename, content_type, Some(text), None));
          }
        };
      }
      _ => {}
    }
  };

  if parsed.subparts.is_empty() {
    add_body_part(parsed);
  } else {
    for subpart in parsed.subparts.into_iter() {
      if subpart.subparts.is_empty() {
        add_body_part(subpart);
      } else {
        for subpart in subpart.subparts.into_iter() {
          add_body_part(subpart);
        }
      }
    }
  }

  let win = window::main_window(None);
  let _ = win.emit("mail-received", payload);
}
