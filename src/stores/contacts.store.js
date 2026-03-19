import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const AMO_CONTACTS = `${location.origin}/api/v4/contacts`;

export const useContactsStore = defineStore('contacts', () => {
  const all_contacts = ref([]);

  // Session-scoped cache — avoids duplicate API calls for the same number
  const phoneCache = new Map();

  function buildContactLink(id) {
    return `${window.location.origin}/contacts/detail/${id}`;
  }

  async function getAllContacts() {
    try {
      const response = await axios.get(AMO_CONTACTS);
      const contacts = response.data._embedded?.contacts ?? [];
      all_contacts.value = contacts.map((c) => ({
        ...c,
        contact_page_link: buildContactLink(c.id),
      }));
    } catch (error) {
      console.error('[Contacts] Error fetching all contacts:', error);
    }
  }

  async function findContactByPhone(phone) {
    if (phoneCache.has(phone)) return phoneCache.get(phone);

    try {
      const response = await axios.get(`${AMO_CONTACTS}?query=${encodeURIComponent(phone)}`);
      const contacts = response.data._embedded?.contacts ?? [];
      const result = contacts.length
        ? { ...contacts[0], contact_page_link: buildContactLink(contacts[0].id) }
        : null;
      if (result) phoneCache.set(phone, result);
      return result;
    } catch (error) {
      console.error(`[Contacts] Error searching contact by phone (${phone}):`, error);
      return null;
    }
  }

  async function createContactIfMissing(phone) {
    const existing = await findContactByPhone(phone);
    if (existing) return { created: 'no', contact: existing };

    try {
      const response = await axios.post(AMO_CONTACTS, [
        {
          name: `Контакт: "${phone}"`,
          custom_fields_values: [
            { field_code: 'PHONE', values: [{ value: phone }] },
          ],
        },
      ]);
      const raw = response.data._embedded?.contacts?.[0];
      if (!raw) return { created: 'error', contact: null };
      const contact = { ...raw, contact_page_link: buildContactLink(raw.id) };
      phoneCache.set(phone, contact);
      return { created: 'yes', contact };
    } catch (error) {
      console.error('[Contacts] Error creating contact:', error);
      return { created: 'error', contact: null };
    }
  }

  function openWidgetPage(link) {
    if (!link) return;
    if (window.AMOCRM?.router) {
      const id = link.split('/').at(-1);
      window.AMOCRM.router.navigate(`/contacts/detail/${id}`, { trigger: true });
    } else {
      window.open(link, '_self');
    }
  }

  return {
    all_contacts,
    getAllContacts,
    findContactByPhone,
    createContactIfMissing,
    openWidgetPage,
  };
});
