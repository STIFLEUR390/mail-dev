<template>
  <button type="button" role="switch" :aria-checked="modelValue" :aria-label="label"
          @click="$emit('update:modelValue', !modelValue)"
          class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:scale-[0.96]"
          :class="modelValue ? 'bg-emerald-600' : 'bg-zinc-400 dark:bg-zinc-600'">
    <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
          :class="modelValue ? 'translate-x-6' : 'translate-x-1'"></span>
  </button>
</template>

<script setup>
defineProps({
  modelValue: {type: Boolean, required: true},
  label: {type: String, default: ''},
});
defineEmits(['update:modelValue']);
</script>
