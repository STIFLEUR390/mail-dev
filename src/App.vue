<template>
  <div class="h-dvh flex overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <Sidebar/>
    <div class="w-full h-full">
      <RouterView/>
    </div>
  </div>
</template>

<script setup>
import {onMounted, watch} from 'vue';
import {listen} from '@tauri-apps/api/event';
import {invoke} from '@tauri-apps/api/core';
import {isPermissionGranted, requestPermission, sendNotification} from '@tauri-apps/plugin-notification';
import {useI18n} from 'vue-i18n';
import Sidebar from './components/Sidebar.vue';
import {useMailboxStore} from './stores/mailbox';
import {useSettingStore} from './stores/setting';
import {initDb, saveSettings} from './stores/db';
import {check} from '@tauri-apps/plugin-updater';
import {useTheme} from './composables/useTheme';

const {t, locale} = useI18n();
const mailbox = useMailboxStore();
const setting = useSettingStore();
useTheme();

// Keep the i18n locale and document language in sync with the persisted setting.
watch(
  () => setting.locale,
  (value) => {
    locale.value = value;
    document.documentElement.lang = value;
  },
  {immediate: true}
);

function notify(body = '') {
  sendNotification({
    title: t('app.mailReceived'),
    body,
  });
}

onMounted(async () => {
  // Load persisted data from SQLite (mails + settings), then keep settings in sync.
  try {
    await initDb();
    await setting.initFromDb();
    await mailbox.initFromDb();
  } catch (err) {
    console.warn('[app] persistence init failed:', err);
  }
  // Debounce settings persistence: group rapid consecutive changes into one write.
  let saveSettingsTimer = null;
  setting.$subscribe((_mutation, state) => {
    clearTimeout(saveSettingsTimer);
    saveSettingsTimer = setTimeout(() => {
      saveSettings(state).catch(err => console.warn('[app] failed to persist settings:', err));
    }, 400);
  });

  // Silent background update check: notify the user if a new release exists.
  setTimeout(async () => {
    try {
      const update = await check();
      if (update) {
        notify(t('app.updateAvailable', {version: update.version}));
      }
    } catch (err) {
      // Offline, not a Tauri build, or updater not configured: ignore.
    }
  }, 5000);

  listen("mail-received", (res) => {
    mailbox.addMail(res.payload);

    if (setting.forwardEnabled === true) {
      invoke('forward_mail', {
        host: setting.forwardEmailHost,
        port: setting.forwardEmailPort,
        username: setting.forwardEmailUsername,
        password: setting.forwardEmailPassword,
        email_content: res.payload.mime,
        email_to: res.payload.to,
        email_subject: res.payload.subject,
      })
        .then(r => console.log('[forward]', r))
        .catch(err => console.warn('[forward] failed:', err));
    }

    if (setting.useNotification === true) {
      isPermissionGranted().then(granted => {
        if (!granted) {
          requestPermission().then(response => {
            if (response === 'granted') {
              notify(res.payload.subject);
            }
          });
        } else {
          notify(res.payload.subject);
        }
      });
    }
  });
});
</script>
