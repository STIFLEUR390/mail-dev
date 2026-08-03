<template>
  <!-- Empty state -->
  <div v-if="mailbox.mails.length === 0" class="flex flex-col justify-center items-center h-full w-full text-lg text-gray-700">
    <div>
      <svg class="w-20 fill-current text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
        <path class="opacity-40" d="M432 64H144a144 144 0 0 1 144 144v208a32 32 0 0 1-32 32h288a32 32 0 0 0 32-32V208A144 144 0 0 0 432 64zm80 208a16 16 0 0 1-16 16h-32a16 16 0 0 1-16-16v-48h-56a8 8 0 0 1-8-8v-16a8 8 0 0 1 8-8h104a16 16 0 0 1 16 16z"/>
        <path d="M143.93 64C64.2 64 0 129.65 0 209.38V416a32 32 0 0 0 32 32h224a32 32 0 0 0 32-32V208A144 144 0 0 0 143.93 64zM224 240a16 16 0 0 1-16 16H80a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h128a16 16 0 0 1 16 16zm272-48H392a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h56v48a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16z"/>
      </svg>
    </div>
    <div class="font-semibold text-gray-500 mb-2">No mail to show!</div>
    <div class="text-sm text-gray-500 mb-2">Send emails using this smtp server:</div>
    <div class="flex items-center mb-2">
      <div class="font-mono text-sm block bg-gray-900 shadow-inner rounded-md px-2 py-1 text-gray-300">{{ setting.ipAddress }}:{{ setting.port }}</div>
      <div v-if="!setting.srvStatus" @click="startServer"
           class="underline ml-2 cursor-pointer font-semibold hover:opacity-80 text-xs">Start Server
      </div>
      <div v-else @click="stopServer"
           class="underline ml-2 cursor-pointer font-semibold hover:opacity-80 text-xs">Stop Server
      </div>
    </div>
    <div v-if="setting.srvResponseMessage" class="text-xs text-red-600 font-medium mb-2">{{ setting.srvResponseMessage }}</div>
  </div>

  <!-- Mail list + detail -->
  <div v-else class="flex h-full">
    <!-- List -->
    <div class="h-full flex-shrink-0 w-64 lg:w-80 xl:w-96 border-r border-gray-300/70 scroll overflow-y-auto">
      <div class="py-2 px-2 items-center flex justify-end border-b border-gray-300/70">
        <button @click="clearAllMails" class="block ml-auto rounded-md px-2.5 py-1.5 uppercase text-xs font-semibold flex items-center gap-x-1 hover:text-red-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Delete all mails
        </button>
      </div>
      <div v-for="mail in mailbox.mails" :key="mail.key">
        <div :class="mailRowClass(mail)" @click="selectMail(mail)">
          <div :class="`h-2 w-2 flex-shrink-0 rounded-full mr-2 ${unreadDotClass(mail)}`"></div>
          <div :class="`w-full py-1 ${rowTextClass(mail)}`">
            <div :class="`truncate text-sm font-medium w-44 lg:w-60 xl:w-72 ${mail.seen === false && 'font-bold'}`">{{ mail.subject }}</div>
            <div class="text-xs truncate">{{ mail.to }}</div>
          </div>

          <svg v-if="mail.attachments.length > 0" :class="`h-5 w-5 fill-current ${mail.key === mailbox.mailIndex ? 'text-gray-100' : 'text-gray-700'}`" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M67.508 468.467c-58.005-58.013-58.016-151.92 0-209.943l225.011-225.04c44.643-44.645 117.279-44.645 161.92 0 44.743 44.749 44.753 117.186 0 161.944l-189.465 189.49c-31.41 31.413-82.518 31.412-113.926.001-31.479-31.482-31.49-82.453 0-113.944L311.51 110.491c4.687-4.687 12.286-4.687 16.972 0l16.967 16.971c4.685 4.686 4.685 12.283 0 16.969L184.983 304.917c-12.724 12.724-12.73 33.328 0 46.058 12.696 12.697 33.356 12.699 46.054-.001l189.465-189.489c25.987-25.989 25.994-68.06.001-94.056-25.931-25.934-68.119-25.932-94.049 0l-225.01 225.039c-39.249 39.252-39.258 102.795-.001 142.057 39.285 39.29 102.885 39.287 142.162-.028A739446.174 739446.174 0 0 1 439.497 238.49c4.686-4.687 12.282-4.684 16.969.004l16.967 16.971c4.685 4.686 4.689 12.279.004 16.965a755654.128 755654.128 0 0 0-195.881 195.996c-58.034 58.092-152.004 58.093-210.048.041z"/>
          </svg>
          <div :class="`flex-shrink-0 ml-2 ${mail.key === mailbox.mailIndex ? 'text-gray-100' : 'text-gray-600'}`">
            <svg class="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
              <path d="M24.707 38.101L4.908 57.899c-4.686 4.686-4.686 12.284 0 16.971L185.607 256 4.908 437.13c-4.686 4.686-4.686 12.284 0 16.971L24.707 473.9c4.686 4.686 12.284 4.686 16.971 0l209.414-209.414c4.686-4.686 4.686-12.284 0-16.971L41.678 38.101c-4.687-4.687-12.285-4.687-16.971 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail -->
    <div v-if="mailbox.mailIndex !== null" class="flex flex-col min-h-screen bg-gray-50 w-full px-6 py-3">
      <div class="text-xl pt-2 pb-4 text-gray-800">{{ mailbox.mail.subject || 'Subject' }}</div>
      <div class="border rounded-md bg-white whitespace-pre-wrap p-4 text-sm font-sans text-gray-600 mb-2">
        <span class="font-medium">From</span> : <span class="text-gray-500">{{ mailbox.mail.from || '' }}</span> <br/>
        <span class="font-medium">To</span> : <span class="text-gray-500">{{ mailbox.mail.to || '' }}</span> <br/>
        <span class="font-medium">Message-ID</span> : <span class="text-gray-500">{{ mailbox.mail.message_id || '' }}</span> <br/>
      </div>

      <div v-if="mailbox.mail.attachments.length > 0" class="border rounded-md bg-white whitespace-pre-wrap p-2 mb-2 mt-4 text-sm font-sans text-gray-600">
        <div v-for="(attachment, key) in mailbox.mail.attachments" :key="key" @click="saveAttachment(attachment)" class="py-0.5">
          <div class="flex w-full items-center cursor-pointer text-gray-500 hover:text-gray-900">
            <svg class="h-4 w-4 mr-1.5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M67.508 468.467c-58.005-58.013-58.016-151.92 0-209.943l225.011-225.04c44.643-44.645 117.279-44.645 161.92 0 44.743 44.749 44.753 117.186 0 161.944l-189.465 189.49c-31.41 31.413-82.518 31.412-113.926.001-31.479-31.482-31.49-82.453 0-113.944L311.51 110.491c4.687-4.687 12.286-4.687 16.972 0l16.967 16.971c4.685 4.686 4.685 12.283 0 16.969L184.983 304.917c-12.724 12.724-12.73 33.328 0 46.058 12.696 12.697 33.356 12.699 46.054-.001l189.465-189.489c25.987-25.989 25.994-68.06.001-94.056-25.931-25.934-68.119-25.932-94.049 0l-225.01 225.039c-39.249 39.252-39.258 102.795-.001 142.057 39.285 39.29 102.885 39.287 142.162-.028A739446.174 739446.174 0 0 1 439.497 238.49c4.686-4.687 12.282-4.684 16.969.004l16.967 16.971c4.685 4.686 4.689 12.279.004 16.965a755654.128 755654.128 0 0 0-195.881 195.996c-58.034 58.092-152.004 58.093-210.048.041z"/>
            </svg>
            <div>{{ attachment[0] }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center pb-2 pt-2">
        <div v-for="item in tabs" :key="item" :class="tabClass(item)" @click="tab = item">
          <template v-if="item === 'Spam Reports' && mailbox.mail.spam_score !== ''">
            {{ item }}
            <div :class="`ml-1 rounded text-xs px-2 flex justify-center items-center font-semibold ${tab === item ? 'bg-white text-gray-500' : 'bg-gray-500 text-white'}`">{{ mailbox.mail.spam_score }}</div>
          </template>
          <template v-else>{{ item }}</template>
        </div>
        <button @click="deleteSelected" class="block ml-auto rounded-md px-2.5 py-1.5 uppercase text-xs font-semibold flex items-center gap-x-1 hover:text-red-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Delete
        </button>
      </div>

      <div class="grow scroll overflow-y-auto bg-white rounded-md border">
        <MailContent :tab="tab" :mail="mailbox.mail" :spam-error="spamError"/>
      </div>
    </div>

    <div v-else class="h-full bg-gray-50 w-full px-2 pb-3 scroll overflow-y-auto flex flex-col justify-center items-center text-lg text-gray-700">
      <div>
        <svg class="w-20 fill-current text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <path class="opacity-40" d="M432 64H144a144 144 0 0 1 144 144v208a32 32 0 0 1-32 32h288a32 32 0 0 0 32-32V208A144 144 0 0 0 432 64zm80 208a16 16 0 0 1-16 16h-32a16 16 0 0 1-16-16v-48h-56a8 8 0 0 1-8-8v-16a8 8 0 0 1 8-8h104a16 16 0 0 1 16 16z"/>
          <path d="M143.93 64C64.2 64 0 129.65 0 209.38V416a32 32 0 0 0 32 32h224a32 32 0 0 0 32-32V208A144 144 0 0 0 143.93 64zM224 240a16 16 0 0 1-16 16H80a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h128a16 16 0 0 1 16 16zm272-48H392a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h56v48a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16z"/>
        </svg>
      </div>
      <div class="font-semibold text-gray-500">Select a mail!</div>
    </div>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {fetch} from '@tauri-apps/plugin-http';
import {ask, save} from '@tauri-apps/plugin-dialog';
import {writeFile} from '@tauri-apps/plugin-fs';
import MailContent from '../components/MailContent.vue';
import {useMailboxStore} from '../stores/mailbox';
import {useSettingStore} from '../stores/setting';
import {useSmtpServer} from '../composables/useSmtpServer';

const mailbox = useMailboxStore();
const setting = useSettingStore();
const {startServer, stopServer} = useSmtpServer();

const tab = ref('HTML');
const spamError = ref('');

const tabs = computed(() => {
  return (mailbox.mail.html === "" ? ["Text", "Raw", "Headers", "Spam Reports"] : ["HTML", "HTML-Source", "Text", "Raw", "Headers", "Spam Reports"]);
});

// Fetch spam score when the Spam Reports tab is opened
watch(
  [tab, () => mailbox.mail],
  () => {
    if (tab.value === 'Spam Reports') {
      getSpamScore(mailbox.mail);
    }
  },
  {deep: true}
);

function tabClass(item) {
  return `flex justify-center py-1 mr-0.5 px-2 text-sm cursor-pointer select-none whitespace-nowrap ${tab.value === item ? 'bg-gray-600 rounded-md text-white' : ''}`;
}

function mailRowClass(mail) {
  return `border-b border-gray-300/70 flex items-center py-3 cursor-pointer select-none px-2 ${mail.key === mailbox.mailIndex ? 'bg-gray-700' : 'hover:bg-gray-300/40'}`;
}

function unreadDotClass(mail) {
  if (mail.seen === false) return 'bg-green-500';
  return mail.key === mailbox.mailIndex ? 'bg-gray-200' : 'bg-gray-400/50';
}

function rowTextClass(mail) {
  if (mail.seen === false) return 'text-gray-600';
  return mail.key === mailbox.mailIndex ? 'text-gray-100' : 'text-gray-700';
}

function selectMail(mail) {
  mailbox.setMailIndex(mail.key);
  tab.value = mail.html === "" ? 'Text' : 'HTML';
}

// Confirm dialog with graceful fallback for plain-browser dev mode.
async function confirmAction(message) {
  try {
    return await ask(message, {title: 'Mail-Dev', kind: 'warning'});
  } catch (err) {
    return window.confirm(message);
  }
}

async function clearAllMails() {
  const ok = await confirmAction('Delete all mails? This cannot be undone.');
  if (ok) mailbox.clearMails();
}

async function deleteSelected() {
  if (mailbox.mailIndex === null) return;
  const ok = await confirmAction('Delete this mail?');
  if (ok) mailbox.deleteMail(mailbox.mailIndex);
}

// Keyboard shortcuts: Delete removes the selected mail, arrows move the selection.
function onKeydown(e) {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
  if (e.key === 'Delete' && mailbox.mailIndex !== null) {
    e.preventDefault();
    deleteSelected();
  }
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && mailbox.mails.length > 0) {
    const idx = mailbox.mails.findIndex(m => m.key === mailbox.mailIndex);
    const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
    if (idx !== -1 && next >= 0 && next < mailbox.mails.length) {
      e.preventDefault();
      selectMail(mailbox.mails[next]);
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

function getSpamScore(mail) {
  if (!setting.spamChecking) return;
  if (mail.spam_score !== "") return;
  spamError.value = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  fetch("https://spamcheck.postmarkapp.com/filter", {
    method: "POST",
    body: JSON.stringify({email: mail.mime.toString(), options: "long"}),
    headers: {"Accept": "application/json", "Content-Type": "application/json"},
    signal: controller.signal,
  })
    .then(res => res.json())
    .then(data => {
      mailbox.setSpamScore({
        key: mail.key,
        spam_score: data.score,
        spam_rules: data.rules,
      });
    })
    .catch(err => {
      spamError.value = `Spam check failed: ${err}`;
      console.log(err);
    })
    .finally(() => clearTimeout(timeout));
}

async function saveAttachment(attachment) {
  let path = await save({
    defaultPath: attachment[0],
    filters: [{name: 'Save Attachment.', extensions: []}]
  });

  if (path !== null) {
    if (attachment[2] === null) {
      await writeFile(path, attachment[3]);
    } else {
      await writeFile(path, attachment[2]);
    }
  }
}
</script>
