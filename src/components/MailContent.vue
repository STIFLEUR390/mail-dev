<template>
  <!-- Raw -->
  <div v-if="tab === 'Raw'" class="whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-300 break-words">{{ mail.mime }}</div>

  <!-- Text -->
  <div v-else-if="tab === 'Text'" class="whitespace-pre-wrap p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words">{{ mail.text }}</div>

  <!-- Headers -->
  <div v-else-if="tab === 'Headers'" class="whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-300 break-words">
    <div v-for="(header, key) in mail.headers" :key="key">
      <span class="font-semibold text-zinc-800 dark:text-zinc-100">{{ header[0] }}</span>: {{ header[1] }}
    </div>
  </div>

  <!-- HTML -->
  <div v-else-if="tab === 'HTML'" class="h-full w-full scroll overflow-y-auto">
    <!-- Untrusted email HTML: sandboxed without allow-scripts/allow-same-origin (no JS,
         opaque origin) so a malicious email cannot run code or access the app. -->
    <iframe id="previewIframe" :title="t('mailContent.previewTitle')" sandbox="allow-popups allow-popups-to-escape-sandbox"
            :src="htmlSrc" class="w-full h-full"></iframe>
  </div>

  <!-- HTML-Source -->
  <div v-else-if="tab === 'HTML-Source'" class="whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-300 break-words">{{ mail.html }}</div>

  <!-- Spam Reports -->
  <div v-else-if="tab === 'Spam Reports'" class="p-4 text-sm text-zinc-700 dark:text-zinc-300">
    <div v-if="spamError" class="flex items-center gap-2 text-red-600 dark:text-red-400">
      <PhWarningCircle :size="18"/>
      <span>{{ t('mailContent.spamFailed', {error: spamError}) }}</span>
    </div>

    <!-- Loading skeleton matching the score card + table shape -->
    <div v-else-if="mail.spam_score === ''" class="animate-pulse" role="status" :aria-label="t('mailContent.spamLoading')">
      <div class="h-6 w-64 bg-zinc-200 dark:bg-zinc-700 rounded-md mb-2"></div>
      <div class="h-4 w-96 max-w-full bg-zinc-200 dark:bg-zinc-700 rounded mb-5"></div>
      <div class="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-3"></div>
      <div v-for="i in 5" :key="i" class="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded mb-2"></div>
    </div>

    <template v-else>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="font-semibold text-zinc-900 dark:text-zinc-50">{{ t('mailContent.spamScoreLabel') }}</h1>
        <span class="rounded-md bg-emerald-600 text-white px-2 py-0.5 font-mono font-semibold text-sm">{{ mail.spam_score }}</span>
      </div>
      <p class="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{{ t('mailContent.spamHint') }}</p>
      <div class="overflow-y-auto scroll border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-zinc-400 dark:text-zinc-500">
              <th class="uppercase text-[11px] tracking-wider font-semibold text-left pr-4 w-16">{{ t('mailContent.score') }}</th>
              <th class="uppercase text-[11px] tracking-wider font-semibold text-left">{{ t('mailContent.description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rule, index) in mail.spam_rules" :key="index" class="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
              <td class="py-2 text-xs text-zinc-800 dark:text-zinc-200 font-mono text-right pr-4 font-semibold">{{ rule.score }}</td>
              <td class="py-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">{{ rule.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <div v-else></div>
</template>

<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {PhWarningCircle} from '@phosphor-icons/vue';

const {t} = useI18n();

const props = defineProps({
  tab: {type: String, default: 'HTML'},
  mail: {type: Object, default: () => ({})},
  spamError: {type: String, default: ''},
});

const htmlSrc = computed(() => {
  if (props.tab !== 'HTML') return '';
  const data = `<html lang="en"><head><base target='_blank' /></head><body><div>${props.mail.html || ''}</div></body></html>`;
  const blob = new Blob([data], {type: 'text/html'});
  return URL.createObjectURL(blob);
});
</script>
