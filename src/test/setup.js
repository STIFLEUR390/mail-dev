// Vitest setup: polyfills + Tauri runtime mocks so store/component tests run
// in a plain jsdom environment (the real Tauri IPC is unavailable).
import {vi} from 'vitest';

// jsdom does not implement window.matchMedia (used by useTheme).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  });
}

// The SQLite plugin is mocked to reject: db.js degrades to no-ops, which is
// exactly the plain-browser fallback the app relies on.
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.reject(new Error('no tauri runtime'))),
  },
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve('')),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: vi.fn(() => Promise.resolve(true)),
  save: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeFile: vi.fn(() => Promise.resolve()),
  copyFile: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(),
  exists: vi.fn(() => Promise.resolve(false)),
  mkdir: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(() => Promise.resolve(false)),
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  sendNotification: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@tauri-apps/plugin-autostart', () => ({
  enable: vi.fn(() => Promise.resolve()),
  disable: vi.fn(() => Promise.resolve()),
  isEnabled: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('')),
}));

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn(() => Promise.resolve('/tmp/app-data')),
  join: vi.fn((...parts) => Promise.resolve(parts.join('/'))),
}));
