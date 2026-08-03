import {onBeforeUnmount, onMounted, watch} from 'vue';
import {useSettingStore} from '../stores/setting';

// Resolves the "system | light | dark" preference onto the <html> .dark class
// and the color-scheme hint (scrollbars, form controls). "system" tracks the OS.
export function useTheme() {
  const setting = useSettingStore();

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    const dark =
      setting.theme === 'dark' ||
      (setting.theme === 'system' && media.matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
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
