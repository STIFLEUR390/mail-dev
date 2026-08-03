<template>
  <div class="min-h-screen h-screen flex">
    <Sidebar/>
    <div class="w-full h-full">
      <RouterView/>
    </div>
  </div>
</template>

<script setup>
import {onMounted} from 'vue';
import {listen} from '@tauri-apps/api/event';
import {invoke} from '@tauri-apps/api/core';
import {isPermissionGranted, requestPermission, sendNotification} from '@tauri-apps/plugin-notification';
import Sidebar from './components/Sidebar.vue';
import {useMailboxStore} from './stores/mailbox';
import {useSettingStore} from './stores/setting';
import {initDb, saveSettings} from './stores/db';
import {check} from '@tauri-apps/plugin-updater';

const mailbox = useMailboxStore();
const setting = useSettingStore();

function notify(body = '') {
  sendNotification({
    title: "Mail-Dev: Mail Received",
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
  setting.$subscribe((_mutation, state) => {
    saveSettings(state);
  });

  // Silent background update check: notify the user if a new release exists.
  setTimeout(async () => {
    try {
      const update = await check();
      if (update) {
        notify(`Update ${update.version} available — open Settings to install.`);
      }
    } catch (err) {
      // Offline, not a Tauri build, or updater not configured: ignore.
    }
  }, 5000);

  listen("mail-received", (res) => {
    mailbox.addMail(res.payload);

    if (setting.forwardEnabled === true) {
      console.log(res.payload);
      invoke('forward_mail', {
        host: setting.forwardEmailHost,
        port: setting.forwardEmailPort,
        username: setting.forwardEmailUsername,
        password: setting.forwardEmailPassword,
        email_content: res.payload.mime,
        email_to: res.payload.to,
        email_subject: res.payload.subject,
      }).then(r => console.log(r));
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
