import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useContactsStore } from './contacts.store';
import { getCallsFromStorage, saveCallToStorage, updateCallInStorage } from '../utils/callStorage';

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
  let contactsEnriched = false;

  const formattedCalls = computed(() =>
    calls.value.map((call) => ({
      ...call,
      call_status: [call.status, CALL_STATUSES[call.status] ?? 'Неизвестно'],
      direction: [3, 4].includes(call.status) ? 'outgoing' : 'incoming',
    }))
  );

  function fetchCalls() {
    calls.value = getCallsFromStorage();
  }

  function addCall(call) {
    saveCallToStorage(call);
    const idx = calls.value.findIndex(c => c.id === call.id);
    if (idx !== -1) {
      calls.value[idx] = call;
    } else {
      calls.value.unshift(call);
    }
  }

  async function reAddContactInfo() {
    if (contactsEnriched) return;
    contactsEnriched = true;

    const contactsStore = useContactsStore();

    // Collect unique phone numbers that need lookup
    const uniquePhones = [...new Set(
      calls.value
        .filter(c => c.contact === null && c.number)
        .map(c => c.number)
    )];

    // Fetch all unique phones in parallel
    const results = await Promise.all(
      uniquePhones.map(phone => contactsStore.findContactByPhone(phone))
    );

    const phoneToContact = new Map(
      uniquePhones.map((phone, i) => [phone, results[i]])
    );

    // Apply results and persist enriched contacts to storage
    for (const call of calls.value) {
      if (call.contact === null && call.number) {
        const contact = phoneToContact.get(call.number);
        if (contact?.contact_page_link) {
          call.contact = { contact_page_link: contact.contact_page_link, name: contact.name };
          updateCallInStorage(call.id, { contact: call.contact });
        }
      }
    }
  }

  return {
    calls,
    formattedCalls,
    fetchCalls,
    addCall,
    reAddContactInfo,
  };
});
