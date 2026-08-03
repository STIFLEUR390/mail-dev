<template>
  <!-- Raw -->
  <div v-if="tab === 'Raw'" class="whitespace-pre-wrap p-2 text-sm font-sans text-gray-600">{{ mail.mime }}</div>

  <!-- Text -->
  <div v-else-if="tab === 'Text'" class="whitespace-pre-wrap p-2 text-sm font-sans text-gray-600">{{ mail.text }}</div>

  <!-- Headers -->
  <div v-else-if="tab === 'Headers'" class="whitespace-pre-wrap p-2 text-sm font-sans text-gray-600">
    <div v-for="(header, key) in mail.headers" :key="key">
      <span class="font-semibold">{{ header[0] }}</span>: {{ header[1] }}
    </div>
  </div>

  <!-- HTML -->
  <div v-else-if="tab === 'HTML'" class="h-full w-full scroll overflow-y-auto">
    <iframe id="previewIframe" title="Letter preview" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            :src="htmlSrc" scrolling="no" class="w-full h-full scroll" @load="resizeIframe"></iframe>
  </div>

  <!-- HTML-Source -->
  <div v-else-if="tab === 'HTML-Source'" class="whitespace-pre-wrap p-2 text-sm font-sans text-gray-600">{{ mail.html }}</div>

  <!-- Spam Reports -->
  <div v-else-if="tab === 'Spam Reports'" class="p-2 text-sm font-sans text-gray-600">
    <div v-if="mail.spam_score === ''">Loading...</div>
    <template v-else>
      <h1 class="font-medium mb-1">Your SpamAssassin score is {{ mail.spam_score }}!</h1>
      <p class="mb-3 text-sm text-gray-700">The lower your score, the more likely your email is going to be received in your subscribers' inboxes.</p>
      <div class="h-100 overflow-y-auto scroll border-t-2 border-dashed border-gray-300 pt-2">
        <table class="w-full border-collapse text-gray-700">
          <thead>
            <tr class="text-gray-600 text-xs">
              <th class="uppercase text-xs font-semibold text-left pr-4 w-16">Score</th>
              <th class="uppercase text-xs font-semibold text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rule, index) in mail.spam_rules" :key="index" class="bg-gray-200 even:bg-gray-200/40 odd:bg-gray-200/20">
              <td class="py-2 text-xs text-gray-900 font-mono text-right pr-4 font-semibold">{{ rule.score }}</td>
              <td class="py-2 text-xs text-gray-500 font-mono">{{ rule.description }}</td>
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

const props = defineProps({
  tab: {type: String, default: 'HTML'},
  mail: {type: Object, default: () => ({})},
});

const htmlSrc = computed(() => {
  if (props.tab !== 'HTML') return '';
  const data = `<html lang="en"><head><base target='_blank' /></head><body><div>${props.mail.html || ''}</div></body></html>`;
  const blob = new Blob([data], {type: 'text/html'});
  return URL.createObjectURL(blob);
});

function resizeIframe() {
  const previewIframe = document.getElementById('previewIframe');
  if (!previewIframe) return;
  let iframeBody = previewIframe.contentWindow.document.body;
  if (iframeBody) previewIframe.style.height = `${iframeBody.offsetHeight + 30}px`;
  let iframeHeight = previewIframe.contentWindow.document.body.offsetHeight;
  if (iframeHeight < 500) iframeHeight = 500 - 10;
  previewIframe.style.height = `${iframeHeight}px`;
}
</script>
