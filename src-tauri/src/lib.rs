mod forward;
mod smtp;
use forward::forward_mail;
use smtp::{SmtpServerState, start_smtp_server, stop_smtp_server};
use tauri_plugin_sql::{Migration, MigrationKind};

// Public Sentry DSN (proxy HTTPS de l'instance rustrak-api.applix.fr).
// Surchargeable via la variable d'environnement SENTRY_DSN (ex. pour tester
// contre une instance locale) ; une valeur vide désactive l'envoi.
const SENTRY_DSN: &str = "https://d47885ba793546b6881e556350460f05@rustrak-api.applix.fr/3";

fn migrations() -> Vec<Migration> {
  vec![
    Migration {
      version: 1,
      description: "create_initial_tables",
      sql: r#"
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mails (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          mime TEXT NOT NULL,
          headers TEXT NOT NULL DEFAULT '[]',
          text TEXT NOT NULL DEFAULT '',
          html TEXT NOT NULL DEFAULT '',
          from_addr TEXT NOT NULL DEFAULT '',
          to_addr TEXT NOT NULL DEFAULT '',
          message_id TEXT NOT NULL DEFAULT '',
          subject TEXT NOT NULL DEFAULT '',
          x_priority TEXT NOT NULL DEFAULT '',
          attachments TEXT NOT NULL DEFAULT '[]',
          spam_score TEXT NOT NULL DEFAULT '',
          spam_rules TEXT NOT NULL DEFAULT '[]',
          seen INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      "#,
      kind: MigrationKind::Up,
    },
    Migration {
      version: 1,
      description: "drop_initial_tables",
      sql: "DROP TABLE IF EXISTS settings; DROP TABLE IF EXISTS mails;",
      kind: MigrationKind::Down,
    },
  ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let client = sentry::init((
    std::env::var("SENTRY_DSN")
      .ok()
      .filter(|dsn| !dsn.is_empty())
      .unwrap_or_else(|| SENTRY_DSN.to_string()),
    sentry::ClientOptions {
      release: sentry::release_name!(),
      auto_session_tracking: true,
      ..Default::default()
    },
  ));

  // Caution! Everything before here runs in both the app and the crash
  // reporter processes (the crash reporter re-executes this binary).
  #[cfg(not(target_os = "ios"))]
  if let Err(e) = tauri_plugin_sentry::minidump::init(&client) {
    // Crash reporting unavailable (e.g. crashpad handler not found) —
    // Sentry still captures panics, logs and browser events.
    eprintln!("[sentry] minidump disabled: {}", e);
  }

  tauri::Builder::default()
    .manage(SmtpServerState::default())
    .plugin(tauri_plugin_sentry::init(&client))
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_process::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:maildev.db", migrations())
        .build(),
    )
    .setup(|app| {
      #[cfg(desktop)]
      app
        .handle()
        .plugin(tauri_plugin_updater::Builder::new().build())?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      start_smtp_server,
      stop_smtp_server,
      forward_mail
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
