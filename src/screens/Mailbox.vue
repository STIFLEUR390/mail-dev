<template>
  <!-- Empty state -->
  <div v-if="mailbox.mails.length === 0" class="flex flex-col justify-center items-center h-full w-full text-zinc-700 dark:text-zinc-200 px-6">
    <div class="text-zinc-300 dark:text-zinc-700 mb-4">
      <PhEnvelopeSimpleOpen :size="72" weight="light"/>
    </div>
    <div class="font-semibold text-zinc-500 dark:text-zinc-400 mb-2">{{ t('mailbox.emptyTitle') }}</div>
    <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{{ t('mailbox.emptyHint') }}</div>
    <div class="flex items-center gap-3 mb-2">
      <div class="font-mono text-sm bg-zinc-900 dark:bg-zinc-800 text-zinc-200 dark:text-zinc-100 rounded-lg px-3 py-1.5 shadow-inner">{{ setting.ipAddress }}:{{ setting.port }}</div>
      <button v-if="!setting.srvStatus" @click="startServer"
              class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2 cursor-pointer transition-colors"
              :aria-label="t('mailbox.startServer')">
        {{ t('mailbox.startServer') }}
      </button>
      <button v-else @click="stopServer"
              class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline underline-offset-2 cursor-pointer transition-colors"
              :aria-label="t('mailbox.stopServer')">
        {{ t('mailbox.stopServer') }}
      </button>
    </div>
    <div v-if="setting.srvResponseMessage" class="text-xs text-red-600 dark:text-red-400 font-medium">{{ setting.srvResponseMessage }}</div>
  </div>

  <!-- Mail list + detail -->
  <div v-else class="flex h-full">
    <!-- List -->
    <div class="h-full flex-shrink-0 w-64 lg:w-80 xl:w-96 border-r border-zinc-200 dark:border-zinc-800 scroll overflow-y-auto">
      <div class="py-2 px-2 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <div class="relative flex-1 min-w-0">
          <PhMagnifyingGlass :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"/>
          <input v-model="mailbox.searchQuery" type="text" :placeholder="t('mailbox.searchPlaceholder')" :aria-label="t('mailbox.searchPlaceholder')"
                 class="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          <button v-if="mailbox.searchQuery" @click="mailbox.searchQuery = ''" :aria-label="t('mailbox.clearSearch')"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
            <PhX :size="14"/>
          </button>
        </div>
        <button @click="clearAllMails" :aria-label="t('mailbox.deleteAll')"
                class="flex items-center gap-x-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0">
          <PhTrash :size="16"/>
          {{ t('mailbox.deleteAll') }}
        </button>
      </div>
      <div v-if="mailbox.filteredMails.length === 0" class="flex flex-col items-center justify-center h-40 px-4 text-center">
        <div class="text-zinc-300 dark:text-zinc-700 mb-2">
          <PhMagnifyingGlass :size="28" weight="light"/>
        </div>
        <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('mailbox.noResults') }}</div>
      </div>
      <div v-for="mail in mailbox.filteredMails" :key="mail.key">
        <div :class="mailRowClass(mail)" @click="selectMail(mail)">
          <div :class="`h-2 w-2 flex-shrink-0 rounded-full mr-2.5 mt-1 ${unreadDotClass(mail)}`"></div>
          <div :class="`w-full py-1 min-w-0 ${rowTextClass(mail)}`">
            <div :class="`truncate text-sm w-44 lg:w-60 xl:w-72 ${mail.seen === false && 'font-semibold'}`">{{ mail.subject }}</div>
            <div class="text-xs truncate opacity-70">{{ mail.to }}</div>
          </div>

          <PhPaperclip v-if="(mail.attachments || []).length > 0" :size="16" :class="`flex-shrink-0 ${mail.key === mailbox.mailIndex ? 'text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`"/>

          <PhCaretRight :size="12" :class="`flex-shrink-0 ml-1.5 ${mail.key === mailbox.mailIndex ? 'text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}`"/>
        </div>
      </div>
    </div>

    <!-- Detail -->
    <div v-if="mailbox.mailIndex !== null" class="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 w-full px-6 py-4">
      <div class="text-xl font-semibold tracking-tight pt-1 pb-4 text-zinc-900 dark:text-zinc-100 break-words">{{ mailbox.mail.subject || t('mailbox.subject') }}</div>

      <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 px-4 py-2.5 mb-2">
        <div v-if="mailbox.mail.from" class="grid grid-cols-[110px_1fr] gap-x-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          <div class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">{{ t('mailbox.from') }}</div>
          <div class="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">{{ mailbox.mail.from }}</div>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          <div class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">{{ t('mailbox.to') }}</div>
          <div class="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">{{ mailbox.mail.to || '' }}</div>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-3 py-1.5 last:border-b-0">
          <div class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">{{ t('mailbox.messageId') }}</div>
          <div class="text-sm font-mono text-zinc-500 dark:text-zinc-400 break-all">{{ mailbox.mail.message_id || '' }}</div>
        </div>
      </div>

      <div v-if="(mailbox.mail.attachments || []).length > 0" class="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 px-4 py-2 mb-2 mt-4">
        <div v-for="(attachment, key) in mailbox.mail.attachments" :key="key" @click="saveAttachment(attachment)">
          <div class="flex w-full items-center gap-2 py-1.5 cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <PhPaperclip :size="16" class="flex-shrink-0"/>
            <div class="text-sm truncate">{{ attachment[0] }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 pb-2 pt-2">
        <div class="flex gap-0.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg" role="tablist" aria-label="Mail view">
          <div v-for="item in tabs" :key="item" :class="tabClass(item)" @click="tab = item" role="tab"
               :aria-selected="tab === item" :tabindex="tab === item ? 0 : -1">
            <template v-if="item === 'Spam Reports' && mailbox.mail.spam_score !== ''">
              {{ item === 'Spam Reports' ? t('mailbox.spamReportsTab') : item }}
              <div :class="`ml-1.5 rounded px-1.5 text-xs flex justify-center items-center font-semibold ${tab === item ? 'bg-emerald-600 text-white' : 'bg-zinc-400 text-white dark:bg-zinc-600'}`">{{ mailbox.mail.spam_score }}</div>
            </template>
            <template v-else>{{ item }}</template>
          </div>
        </div>
        <button @click="deleteSelected" :aria-label="t('mailbox.delete')"
                class="ml-auto flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <PhTrash :size="16"/>
          {{ t('mailbox.delete') }}
        </button>
      </div>

      <div class="grow min-h-0 scroll overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <MailContent :tab="tab" :mail="mailbox.mail" :spam-error="spamError"/>
      </div>
    </div>

    <div v-else class="h-full bg-zinc-50 dark:bg-zinc-950 w-full px-2 pb-3 scroll overflow-y-auto flex flex-col justify-center items-center text-zinc-500 dark:text-zinc-400">
      <div class="text-zinc-300 dark:text-zinc-700 mb-3">
        <PhEnvelopeSimpleOpen :size="72" weight="light"/>
      </div>
      <div class="font-semibold">{{ t('mailbox.selectMail') }}</div>
    </div>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {PhEnvelopeSimpleOpen, PhPaperclip, PhCaretRight, PhTrash, PhMagnifyingGlass, PhX} from '@phosphor-icons/vue';
import {fetch} from '@tauri-apps/plugin-http';
import {invoke} from '@tauri-apps/api/core';
import {ask, save} from '@tauri-apps/plugin-dialog';
import {writeFile} from '@tauri-apps/plugin-fs';
import MailContent from '../components/MailContent.vue';
import {useMailboxStore} from '../stores/mailbox';
import {useSettingStore} from '../stores/setting';
import {useSmtpServer} from '../composables/useSmtpServer';

const mailbox = useMailboxStore();
const setting = useSettingStore();
const {startServer, stopServer} = useSmtpServer();
const {t} = useI18n();

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
  const active = tab.value === item;
  return `flex justify-center items-center py-1.5 px-2.5 text-[13px] font-medium cursor-pointer select-none whitespace-nowrap rounded-md transition-colors ${
    active
      ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50'
      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
  }`;
}

function mailRowClass(mail) {
  const selected = mail.key === mailbox.mailIndex;
  return `border-b border-zinc-200/70 dark:border-zinc-800/70 flex items-center py-3 cursor-pointer select-none px-2.5 transition-colors ${
    selected
      ? 'bg-zinc-800 dark:bg-zinc-700 text-zinc-100 dark:text-zinc-50'
      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
  }`;
}

function unreadDotClass(mail) {
  if (mail.seen === false) return 'bg-emerald-500';
  return mail.key === mailbox.mailIndex ? 'bg-zinc-100/60 dark:bg-zinc-400/60' : 'bg-zinc-300 dark:bg-zinc-600';
}

function rowTextClass(mail) {
  if (mail.seen === false) return 'text-zinc-800 dark:text-zinc-100';
  return mail.key === mailbox.mailIndex ? 'text-zinc-100 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300';
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
  const ok = await confirmAction(t('mailbox.confirmClear'));
  if (ok) mailbox.clearMails();
}

async function deleteSelected() {
  if (mailbox.mailIndex === null) return;
  const ok = await confirmAction(t('mailbox.confirmDelete'));
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
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && mailbox.filteredMails.length > 0) {
    const idx = mailbox.filteredMails.findIndex(m => m.key === mailbox.mailIndex);
    const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
    if (idx !== -1 && next >= 0 && next < mailbox.filteredMails.length) {
      e.preventDefault();
      selectMail(mailbox.filteredMails[next]);
    }
  }
}

// When the active search filters the selected mail out of the list, drop the
// selection so the detail pane never shows a mail that is not listed.
watch(
  () => mailbox.filteredMails,
  (list) => {
    if (mailbox.mailIndex !== null && !list.some(m => m.key === mailbox.mailIndex)) {
      mailbox.clearSelection();
    }
  }
);

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
  const dest = await save({
    defaultPath: attachment[0],
    filters: [{name: t('mailbox.saveAttachment'), extensions: []}]
  });

  if (dest !== null) {
    const text = attachment[2];
    const data = attachment[3];
    try {
      if (text !== null) {
        // Text attachment: stored inline, write directly.
        await writeFile(dest, text);
      } else if (typeof data === 'string') {
        // Binary attachment persisted on disk by the Rust backend.
        await invoke('export_attachment', {relativePath: data, destination: dest});
      } else if (Array.isArray(data)) {
        // Legacy mail: binary stored inline in SQLite.
        await writeFile(dest, new Uint8Array(data));
      }
    } catch (err) {
      console.error('[mailbox] failed to save attachment:', err);
    }
  }
}
</script>
