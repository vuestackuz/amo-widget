import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../../api/axios';
import { useContactsStore } from './contacts';

const CALL_STATUSES = {
  1: 'Входящий',
  2: 'Входящий пропущенный',
  3: 'Исходящий',
  4: 'Исходящий принятый',
  5: 'Входящий пропущенный',
  6: 'Входящий отклонённый',
};

export const useAmoCallsStore = defineStore('amoCalls', () => {
  const calls = ref([]);

  const formattedCalls = computed(() =>
    calls.value.map((call) => ({
      ...call,
      call_status: [call.status, CALL_STATUSES[call.status] ?? 'Неизвестно'],
      direction: [3, 4].includes(call.status) ? 'outgoing' : 'incoming',
    }))
  );

  async function fetchCalls() {
    try {
      const response = await api.get('/amocrm/widget/calls');
      calls.value = (response?.result ?? []).map((call) => ({
        ...call,
        contact: call.contact ?? null,
      }));
    } catch (err) {
      console.error('[AmoCalls] Failed to fetch calls:', err);
    }
  }

  async function reAddContactInfo() {
    const contactsStore = useContactsStore();
    for (const call of calls.value) {
      if (call.contact === null && call.number) {
        const contact = await contactsStore.findContactByPhone(call.number);
        if (contact?.contact_page_link) {
          call.contact = {
            contact_page_link: contact.contact_page_link,
            name: contact.name,
          };
        }
      }
    }
  }

  return {
    calls,
    formattedCalls,
    fetchCalls,
    reAddContactInfo,
  };
});
