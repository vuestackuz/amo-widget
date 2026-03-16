import { useContactsStore } from '../stores/amo-api/contacts';
import { useSipStore } from '../stores/js-sip/sipStore';

export function useContactLinking() {
  const contactsStore = useContactsStore();
  const sipStore = useSipStore();

  let retryTimeout = null;

  async function newContact(phone, id) {
    await contactsStore.createContactIfMissing(phone);

    let attemptsLeft = 5;
    const retry = async () => {
      if (!sipStore.sessions[id] || attemptsLeft <= 0) return;
      attemptsLeft--;
      const contact = await contactsStore.findContactByPhone(phone);
      if (contact !== null && contact.contact_page_link) {
        sipStore.setSessionContact(id, contact);
        return;
      }
      retryTimeout = setTimeout(retry, 1000);
    };

    retry();
  }

  function clearRetry() {
    clearTimeout(retryTimeout);
  }

  return { newContact, clearRetry };
}
