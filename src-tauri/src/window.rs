use std::sync::Once;
use tauri::WebviewWindow;

pub(crate) fn main_window(window: Option<WebviewWindow>) -> WebviewWindow {
  static mut SINGLETON: *const WebviewWindow = 0 as *const WebviewWindow;
  static ONCE: Once = Once::new();
  if let Some(window) = window {
    ONCE.call_once(|| unsafe {
      SINGLETON = std::mem::transmute(Box::new(window));
    });
  }
  unsafe { (*SINGLETON).clone() }
}
