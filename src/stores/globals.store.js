import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useGlobalsStore = defineStore('globals', () => {
  const isModalOpen = ref(false);
  const isSettingsReady = ref(false);

  const mainDomain = computed(() => {
    const domain = window.__AMO_UTEL_WIDGET_SETTINGS__?.domain;
    return domain ? domain.replace(/^https?:\/\//, '') : null;
  });

  return { isModalOpen, isSettingsReady, mainDomain };
});
