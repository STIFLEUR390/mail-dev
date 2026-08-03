#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
fn sanitize_gdk_pixbuf_env() {
  // Snap-packaged terminals (e.g. ghostty) leak GDK_PIXBUF_MODULE_FILE into
  // every shell they spawn. That cache points at loader .so files inside the
  // snap mount, which are frequently stale or missing, so gdk-pixbuf fails
  // for every GTK/WebKitGTK app launched from such a terminal: the window
  // icon cannot load and WebKit page loads die with "WebKit encountered an
  // internal error" (WebLoaderStrategy::internallyFailedLoadTimerFired).
  // Unless the variable points to an existing file outside a snap mount (a
  // deliberate user override), drop it and fall back to the system cache.
  if let Ok(path) = std::env::var("GDK_PIXBUF_MODULE_FILE") {
    let in_snap_mount = path.contains("/snap/");
    let exists = std::path::Path::new(&path).is_file();
    if in_snap_mount || !exists {
      // SAFETY: main() is single-threaded at this point and the variable is
      // only read by GTK/WebKit during their first initialization, which
      // happens after this call. Removing it here is race-free.
      unsafe { std::env::remove_var("GDK_PIXBUF_MODULE_FILE") };
    }
  }
}

fn main() {
  #[cfg(target_os = "linux")]
  sanitize_gdk_pixbuf_env();
  mail_dev_lib::run();
}
