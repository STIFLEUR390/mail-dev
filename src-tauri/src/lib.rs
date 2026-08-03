mod forward;
mod smtp;
mod window;

use forward::forward_mail;
use smtp::start_smtp_server;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
      let _s = window::main_window(app.get_webview_window("main"));
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![start_smtp_server, forward_mail])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
