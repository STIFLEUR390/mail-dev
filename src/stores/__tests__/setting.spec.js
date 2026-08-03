import {beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from 'pinia';
import {useSettingStore} from '../setting';

describe('setting store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has sensible defaults', () => {
    const store = useSettingStore();
    expect(store.srvStatus).toBe(false);
    expect(store.ipAddress).toBe('127.0.0.1');
    expect(store.port).toBe(2525);
    expect(store.spamChecking).toBe(true);
    expect(store.theme).toBe('system');
    expect(store.framework).toBe('Laravel 13');
    expect(['en', 'fr']).toContain(store.locale);
  });

  it('setters update the state', () => {
    const store = useSettingStore();
    store.setPort(2526);
    store.setIpAddress('0.0.0.0');
    store.setTheme('dark');
    store.setSpamChecking(false);
    store.setSrvStatus(true);
    expect(store.port).toBe(2526);
    expect(store.ipAddress).toBe('0.0.0.0');
    expect(store.theme).toBe('dark');
    expect(store.spamChecking).toBe(false);
    expect(store.srvStatus).toBe(true);
  });

  it('initFromDb degrades gracefully when SQLite is unavailable', async () => {
    const store = useSettingStore();
    // The plugin-sql mock rejects: the store must fall back to its defaults
    // without throwing (this is the plain-browser dev fallback).
    await expect(store.initFromDb()).resolves.toBeUndefined();
    expect(store.srvStatus).toBe(false);
    expect(store.port).toBe(2525);
  });
});
