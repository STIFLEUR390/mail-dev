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

const mailbox = useMailboxStore();
const setting = useSettingStore();

function notify(body = '') {
  sendNotification({
    title: "Mail-Dev: Mail Received",
    body,
  });
}

onMounted(() => {
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
