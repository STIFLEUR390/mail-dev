import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from 'pinia';
import {invoke} from '@tauri-apps/api/core';
import {useSettingStore} from '../../stores/setting';
import {useSmtpServer} from '../useSmtpServer';

describe('useSmtpServer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(invoke).mockReset();
  });

  it('startServer marks the server as running on success', async () => {
    vi.mocked(invoke).mockResolvedValue('');
    const setting = useSettingStore();
    const {startServer} = useSmtpServer();
    const ok = await startServer();
    expect(ok).toBe(true);
    expect(setting.srvStatus).toBe(true);
  });

  it('startServer keeps the UI in sync when the server is already running', async () => {
    // Double start / multiple sources (sidebar + empty state + settings):
    // the server IS running, so the UI must not flip to "stopped".
    vi.mocked(invoke).mockResolvedValue('SMTP server is already running on 127.0.0.1:2525');
    const setting = useSettingStore();
    const {startServer} = useSmtpServer();
    const ok = await startServer();
    expect(ok).toBe(false);
    expect(setting.srvStatus).toBe(true);
  });

  it('startServer reports a bind failure without marking the server running', async () => {
    vi.mocked(invoke).mockResolvedValue('address already in use');
    const setting = useSettingStore();
    const {startServer} = useSmtpServer();
    const ok = await startServer();
    expect(ok).toBe(false);
    expect(setting.srvStatus).toBe(false);
    expect(setting.srvResponseMessage).toContain('address already in use');
  });

  it('stopServer marks the server as stopped on success', async () => {
    vi.mocked(invoke).mockResolvedValue('');
    const setting = useSettingStore();
    setting.setSrvStatus(true);
    const {stopServer} = useSmtpServer();
    const ok = await stopServer();
    expect(ok).toBe(true);
    expect(setting.srvStatus).toBe(false);
  });

  it('stopServer syncs the UI when the server is already stopped', async () => {
    // Stale UI state: the server died / was stopped elsewhere.
    vi.mocked(invoke).mockResolvedValue('SMTP server is not running');
    const setting = useSettingStore();
    setting.setSrvStatus(true);
    const {stopServer} = useSmtpServer();
    const ok = await stopServer();
    expect(ok).toBe(true);
    expect(setting.srvStatus).toBe(false);
  });

  it('surfaces invoke errors instead of throwing or desyncing', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('IPC failed'));
    const setting = useSettingStore();
    setting.setSrvStatus(true);
    const {stopServer} = useSmtpServer();
    const ok = await stopServer();
    expect(ok).toBe(false);
    // We cannot confirm the server stopped: keep the status and show the error.
    expect(setting.srvStatus).toBe(true);
    expect(setting.srvResponseMessage).toContain('IPC failed');
  });

  it('exposes a busy flag while a start/stop request is in flight', async () => {
    let resolveInvoke;
    vi.mocked(invoke).mockReturnValue(new Promise(resolve => {
      resolveInvoke = resolve;
    }));
    const setting = useSettingStore();
    const {startServer} = useSmtpServer();
    const pending = startServer();
    expect(setting.srvBusy).toBe(true);
    resolveInvoke('');
    await pending;
    expect(setting.srvBusy).toBe(false);
    expect(setting.srvStatus).toBe(true);
  });
});
