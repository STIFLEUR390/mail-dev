import {invoke} from '@tauri-apps/api/core';
import {useSettingStore} from '../stores/setting';

// Shared SMTP server start/stop logic used by Mailbox and Settings screens.
export function useSmtpServer() {
  const setting = useSettingStore();

  async function startServer() {
    setting.setSrvResponseMessage('');
    const response = await invoke('start_smtp_server', {
      address: `${setting.ipAddress}:${setting.port}`,
      username: setting.srvAuthEnabled ? setting.srvUsername : '',
      password: setting.srvAuthEnabled ? setting.srvPassword : '',
    });
    if (typeof response === 'string' && response.length > 0) {
      setting.setSrvStatus(false);
      setting.setSrvResponseMessage(response);
      return false;
    }
    setting.setSrvStatus(true);
    return true;
  }

  async function stopServer() {
    setting.setSrvResponseMessage('');
    const response = await invoke('stop_smtp_server');
    if (typeof response === 'string' && response.length > 0) {
      setting.setSrvResponseMessage(response);
      return false;
    }
    setting.setSrvStatus(false);
    return true;
  }

  return {startServer, stopServer};
}
