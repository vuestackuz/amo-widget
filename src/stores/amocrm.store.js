import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useAmocrm } from '../api/services/useAmocrm';

export const useAmocrmStore = defineStore('amocrm', () => {
  const amocrmService = useAmocrm();

  const amocrmInfo = ref(null);
  const isError = ref(false);

  const websocket = computed(() => amocrmInfo.value?.websocket);
  const sipUser = computed(() => amocrmInfo.value?.sip_user);


  const fetchAmocrmInfo = async () => {
    try {
      const response = await amocrmService.getInfo();
      amocrmInfo.value = response.result;
    } catch (error) {
      isError.value = true;
      errorMessage.value = error.message;
    }
  }

  return {
    amocrmInfo,
    isError,
    fetchAmocrmInfo,
    websocket,
    sipUser,
  }
})
