import {onBeforeUnmount, onMounted, watch} from 'vue';
import {useSettingStore} from '../stores/setting';

// Resolves the "system | light | dark" preference onto the <html> .dark class,
// the color-scheme hint (scrollbars, form controls) and the native window
// chrome (titlebar buttons) so a manual theme never clashes with the OS frame.
export function useTheme() {
  const setting = useSettingStore();

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function syncNativeTheme(dark) {
    // Native frame theming is only available inside the Tauri runtime
    // (Windows/macOS); silently no-op in a plain browser or on Linux.
    import('@tauri-apps/api/window')
      .then(({getCurrentWindow}) => getCurrentWindow().setTheme(dark ? 'dark' : 'light'))
      .catch(() => {});
  }

  function apply() {
    const dark =
      setting.theme === 'dark' ||
      (setting.theme === 'system' && media.matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    syncNativeTheme(dark);
  }

  function onMediaChange() {
    if (setting.theme === 'system') apply();
  }

  onMounted(() => {
    apply();
    media.addEventListener('change', onMediaChange);
  });

  onBeforeUnmount(() => media.removeEventListener('change', onMediaChange));

  watch(() => setting.theme, apply);

  return {apply};
}
