import {invoke} from '@tauri-apps/api/core';
import {useSettingStore} from '../stores/setting';

// Shared SMTP server start/stop logic used by Mailbox and Settings screens.
//
// The Rust commands return "" on success or a human-readable error message.
// `srvStatus` must always mirror the real server state, including edge cases:
// - double start ("SMTP server is already running...") → the server IS
//   running, so the UI must show it running (otherwise the stop button
//   disappears and the user is stuck with a running server);
// - stop on an already-stopped server ("... is not running") → sync the UI to
//   stopped;
// - invoke failures → surface the message instead of an unhandled rejection.
export function useSmtpServer() {
  const setting = useSettingStore();

  async function startServer() {
    setting.setSrvResponseMessage('');
    setting.setSrvBusy(true);
    try {
      const response = await invoke('start_smtp_server', {
        address: `${setting.ipAddress}:${setting.port}`,
        username: setting.srvAuthEnabled ? setting.srvUsername : '',
        password: setting.srvAuthEnabled ? setting.srvPassword : '',
      });
      if (typeof response === 'string' && response.length > 0) {
        const alreadyRunning = response.startsWith('SMTP server is already running');
        // Already running → the server is up (keep the stop button visible);
        // any other error (e.g. bind failure) → it is not running.
        setting.setSrvStatus(alreadyRunning);
        setting.setSrvResponseMessage(response);
        return false;
      }
      setting.setSrvStatus(true);
      return true;
    } catch (err) {
      setting.setSrvResponseMessage(String(err));
      return false;
    } finally {
      setting.setSrvBusy(false);
    }
  }

  async function stopServer() {
    setting.setSrvResponseMessage('');
    setting.setSrvBusy(true);
    try {
      const response = await invoke('stop_smtp_server');
      if (typeof response === 'string' && response.length > 0) {
        const notRunning = response.includes('not running');
        // Already stopped → sync the UI to stopped; a real error keeps the
        // current status and shows the message.
        setting.setSrvStatus(!notRunning);
        setting.setSrvResponseMessage(response);
        return notRunning;
      }
      setting.setSrvStatus(false);
      return true;
    } catch (err) {
      setting.setSrvResponseMessage(String(err));
      return false;
    } finally {
      setting.setSrvBusy(false);
    }
  }

  return {startServer, stopServer};
}
