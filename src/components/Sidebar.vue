<template>
  <nav class="w-24 bg-zinc-100 dark:bg-zinc-900 flex-shrink-0 flex flex-col items-center pt-3 pb-3 border-r border-zinc-200 dark:border-zinc-800"
       aria-label="Primary">
    <!-- App logo -->
    <RouterLink to="/mailbox" class="mb-3" :aria-label="t('nav.mailbox')">
      <img src="/logo.png" alt="Mail-Dev" width="44" height="44"
           class="w-11 h-11 rounded-xl shadow-sm select-none"/>
    </RouterLink>

    <RouterLink to="/mailbox" class="w-full flex flex-col items-center mb-1" :aria-label="t('nav.mailbox')">
      <div :class="navClass('/mailbox')">
        <div class="w-16 h-10 flex justify-center items-center">
          <PhMailbox :size="22" :weight="route.path === '/mailbox' ? 'fill' : 'duotone'"/>
        </div>
        <div class="text-[10px] font-medium uppercase tracking-wide text-center select-none truncate w-full px-0.5">{{ t('nav.mailbox') }}</div>
      </div>
    </RouterLink>

    <RouterLink to="/settings" class="w-full flex flex-col items-center mb-1" :aria-label="t('nav.settings')">
      <div :class="navClass('/settings')">
        <div class="w-16 h-10 flex justify-center items-center">
          <PhGearSix :size="22" :weight="route.path === '/settings' ? 'fill' : 'duotone'"/>
        </div>
        <div class="text-[10px] font-medium uppercase tracking-wide text-center select-none truncate w-full px-0.5">{{ t('nav.settings') }}</div>
      </div>
    </RouterLink>

    <!-- Bottom controls: language, theme, SMTP server -->
    <div class="mt-auto flex flex-col items-center gap-1 w-full">

      <!-- Language -->
      <div class="relative">
        <button @click.stop="toggleMenu('lang')" :aria-label="t('sidebar.language')" :aria-expanded="menu === 'lang'"
                class="w-12 h-12 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <PhTranslate :size="22"/>
        </button>
        <div v-if="menu === 'lang'"
             class="absolute bottom-0 left-[5.5rem] z-50 w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
          <button v-for="opt in langOptions" :key="opt.value" @click="setLocale(opt.value)"
                  class="w-full flex items-center justify-between px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            {{ opt.label }}
            <PhCheck v-if="setting.locale === opt.value" :size="14" class="text-emerald-600 dark:text-emerald-400"/>
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div class="relative">
        <button @click.stop="toggleMenu('theme')" :aria-label="t('sidebar.theme')" :aria-expanded="menu === 'theme'"
                class="w-12 h-12 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <PhSun v-if="setting.theme === 'light'" :size="22"/>
          <PhMoon v-else-if="setting.theme === 'dark'" :size="22"/>
          <PhDesktop v-else :size="22"/>
        </button>
        <div v-if="menu === 'theme'"
             class="absolute bottom-0 left-[5.5rem] z-50 w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
          <button v-for="opt in themeOptions" :key="opt.value" @click="setting.setTheme(opt.value)"
                  class="w-full flex items-center justify-between px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            {{ opt.label }}
            <PhCheck v-if="setting.theme === opt.value" :size="14" class="text-emerald-600 dark:text-emerald-400"/>
          </button>
        </div>
      </div>

      <!-- SMTP server -->
      <div class="w-full flex flex-col items-center mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800"
           :title="setting.srvResponseMessage || ''">
        <div class="flex items-center gap-1.5 mb-2 select-none">
          <div :class="`h-2 w-2 rounded-full ${setting.srvStatus ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`"></div>
          <span class="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {{ setting.srvStatus ? t('sidebar.running') : t('sidebar.stopped') }}
          </span>
        </div>
        <button @click="toggleServer"
                :aria-label="setting.srvStatus ? t('sidebar.stopServer') : t('sidebar.startServer')"
                :class="`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-[0.94] ${
                  setting.srvStatus
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`">
          <PhStop v-if="setting.srvStatus" :size="20" :weight="'fill'"/>
          <PhPlay v-else :size="20" :weight="'fill'" class="ml-0.5"/>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {PhMailbox, PhGearSix, PhTranslate, PhSun, PhMoon, PhDesktop, PhPlay, PhStop, PhCheck} from '@phosphor-icons/vue';
import {isPermissionGranted, requestPermission, sendNotification} from '@tauri-apps/plugin-notification';
import {useSettingStore} from '../stores/setting';
import {useSmtpServer} from '../composables/useSmtpServer';

const {t} = useI18n();
const route = useRoute();
const setting = useSettingStore();
const {startServer, stopServer} = useSmtpServer();

const menu = ref(null); // 'lang' | 'theme' | null
const langOptions = [
  {value: 'en', label: 'English'},
  {value: 'fr', label: 'Français'},
];
const themeOptions = computed(() => [
  {value: 'system', label: t('sidebar.system')},
  {value: 'light', label: t('sidebar.light')},
  {value: 'dark', label: t('sidebar.dark')},
]);

function navClass(path) {
  const active = route.path === path;
  return `relative mb-3 py-1.5 w-20 rounded-lg transition-all duration-150 cursor-pointer ${
    active
      ? 'text-zinc-50 bg-zinc-800 dark:bg-zinc-700 shadow-sm'
      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
  }`;
}

function toggleMenu(name) {
  menu.value = menu.value === name ? null : name;
}

function setLocale(value) {
  setting.setLocale(value);
  menu.value = null;
}

async function toggleServer() {
  try {
    if (setting.srvStatus) {
      await stopServer();
    } else {
      await startServer();
    }
  } catch (err) {
    setting.setSrvResponseMessage(String(err));
  }
  menu.value = null;
  if (setting.srvStatus && setting.useNotification === true) {
    isPermissionGranted().then(granted => {
      if (!granted) {
        requestPermission().then(response => {
          if (response === 'granted') {
            sendNotification({
              title: t('app.smtpConnection'),
              body: t('app.smtpStartedBody'),
            });
          }
        });
      } else {
        sendNotification({
          title: t('app.smtpConnection'),
          body: t('app.smtpStartedBody'),
        });
      }
    });
  }
}

// Close the floating menus when clicking anywhere else.
function onGlobalClick() {
  menu.value = null;
}
onMounted(() => window.addEventListener('click', onGlobalClick));
onBeforeUnmount(() => window.removeEventListener('click', onGlobalClick));
</script>
