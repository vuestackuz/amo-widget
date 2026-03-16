import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAmocrmStore } from './amocrm.store';

export const useUtelSipUserStore = defineStore('utelSipUser', () => {
  const amocrmStore = useAmocrmStore();

  // Expose SIP user credentials from AmoCRM store
  const sipUser = computed(() => amocrmStore.sipUser);

  // 1 = use client-side SIP (JsSIP), 2 = use server-side origination
  // Always use client-side SIP in this implementation
  const noOtherSoftPhoneConnection = 1;

  return {
    sipUser,
    noOtherSoftPhoneConnection,
  };
});
