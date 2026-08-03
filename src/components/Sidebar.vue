<template>
  <nav class="w-20 bg-zinc-100 dark:bg-zinc-900 flex-shrink-0 flex flex-col items-center pt-3 border-r border-zinc-200 dark:border-zinc-800"
       aria-label="Primary">
    <RouterLink to="/mailbox" class="w-full flex flex-col items-center mb-1" aria-label="Mailbox">
      <div :class="navClass('/mailbox')">
        <div class="w-12 h-10 flex justify-center items-center">
          <PhMailbox :size="24" :weight="route.path === '/mailbox' ? 'fill' : 'duotone'"/>
        </div>
        <div class="text-[11px] font-medium uppercase tracking-wide text-center select-none">Mailbox</div>
      </div>
    </RouterLink>

    <RouterLink to="/settings" class="w-full flex flex-col items-center mb-1" aria-label="Settings">
      <div :class="navClass('/settings')">
        <div class="w-12 h-10 flex justify-center items-center">
          <PhGearSix :size="24" :weight="route.path === '/settings' ? 'fill' : 'duotone'"/>
        </div>
        <div class="text-[11px] font-medium uppercase tracking-wide text-center select-none">Settings</div>
      </div>
    </RouterLink>
  </nav>
</template>

<script setup>
import {useRoute} from 'vue-router';
import {PhMailbox, PhGearSix} from '@phosphor-icons/vue';

const route = useRoute();

function navClass(path) {
  const active = route.path === path;
  return `relative mb-3 py-1.5 w-16 rounded-lg transition-all duration-150 cursor-pointer ${
    active
      ? 'text-zinc-50 bg-zinc-800 dark:bg-zinc-700 shadow-sm'
      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
  }`;
}
</script>
