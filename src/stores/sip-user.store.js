import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAmocrmStore } from './amocrm.store';

export const useUtelSipUserStore = defineStore('utelSipUser', () => {
  const amocrmStore = useAmocrmStore();

  // Expose SIP user credentials from AmoCRM store
  const sipUser = computed(() => amocrmStore.sipUser);

  return {
    sipUser
  };
});
