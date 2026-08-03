use lettre::message::Mailbox;
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParametersBuilder};
use lettre::{Address, Message, SmtpTransport, Transport};
use std::time::Duration;

#[tauri::command]
pub async fn forward_mail(
  host: Option<String>,
  port: Option<String>,
  username: Option<String>,
  password: Option<String>,
  email_content: Option<String>,
  email_to: Option<String>,
  email_subject: Option<String>,
) -> Result<String, String> {
  let host = host.unwrap_or_else(|| "127.0.0.1".to_string());
  let port = port
    .unwrap_or_else(|| "25".to_string())
    .parse::<u16>()
    .map_err(|e| format!("Invalid port: {}", e))?;
  let mut username = username.unwrap_or_default();
  let password = password.unwrap_or_default();
  let email_content = email_content.unwrap_or_default();
  let mut email_to = email_to.unwrap_or_else(|| "email@example.com".to_string());
  let email_subject = email_subject.unwrap_or_default();

  if username.is_empty() {
    username = "maildev@mail-dev.com".to_string();
  }
  if email_to.is_empty() {
    email_to = "email@example.com".to_string();
  }

  let from = username
    .parse::<Address>()
    .map_err(|e| format!("Invalid sender address '{}': {}", username, e))?;
  let to = email_to
    .parse::<Mailbox>()
    .map_err(|e| format!("Invalid recipient address '{}': {}", email_to, e))?;

  let email = Message::builder()
    .from(Mailbox {
      name: Some("Mail-Dev".to_string()),
      email: from,
    })
    .to(to)
    .subject(email_subject)
    .body(email_content)
    .map_err(|e| format!("Failed to build message: {}", e))?;

  let tls_parameters = TlsParametersBuilder::new(host.clone())
    .dangerous_accept_invalid_hostnames(true)
    .dangerous_accept_invalid_certs(true)
    .build()
    .map_err(|e| format!("Failed to build TLS parameters: {}", e))?;

  let security = vec![
    Tls::Opportunistic(tls_parameters.clone()),
    Tls::Wrapper(tls_parameters.clone()),
    Tls::Required(tls_parameters),
    Tls::None,
  ];

  let mut last_error = String::from("unknown error");
  for tls in security {
    let mailer = SmtpTransport::builder_dangerous(host.clone())
      .credentials(Credentials::new(username.clone(), password.clone()))
      .port(port)
      .tls(tls.clone())
      .timeout(Some(Duration::from_secs(10)))
      .build();
    match mailer.send(&email) {
      Ok(_) => return Ok("Email sent successfully!".to_string()),
      Err(e) => {
        eprintln!("[forward] could not send email with {:?}: {}", tls, e);
        last_error = format!("{}", e);
      }
    }
  }
  Err(format!("Could not send email: {}", last_error))
}
