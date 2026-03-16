import { defineStore } from 'pinia';

export const useContactsStore = defineStore('contacts', () => {
  function openWidgetPage(link) {
    if (link) window.open(link, '_blank');
  }

  async function createContactIfMissing(phone) {
    console.warn('[Contacts] createContactIfMissing not implemented:', phone);
    return { contact: null };
  }

  async function findContactByPhone(phone) {
    console.warn('[Contacts] findContactByPhone not implemented:', phone);
    return null;
  }

  return {
    openWidgetPage,
    createContactIfMissing,
    findContactByPhone,
  };
});
