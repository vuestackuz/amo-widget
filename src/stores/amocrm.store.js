import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useAmocrmStore = defineStore('amocrm', () => {
  const amocrmInfo = ref(null);

  const websocket = computed(() => amocrmInfo.value?.websocket);
  const sipUser = computed(() => amocrmInfo.value?.sip_user);

  return {
    amocrmInfo,
    websocket,
    sipUser,
  };
});
