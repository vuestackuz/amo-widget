import { defineStore } from 'pinia';
import { computed } from 'vue';

export const useGlobalsStore = defineStore('globals', () => {
  const mainDomain = computed(() => {
    const domain = window.__AMO_UTEL_WIDGET_SETTINGS__?.domain;
    return domain ? domain.replace(/^https?:\/\//, '') : null;
  });

  return { mainDomain };
});
