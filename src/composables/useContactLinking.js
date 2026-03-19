import { useContactsStore } from '../stores/contacts.store';
import { useSipStore } from '../stores/sip.store';
import { useSipWSStore } from '../stores/sip-ws.store';

export function useContactLinking() {
  const contactsStore = useContactsStore();
  const sipStore = useSipStore();
  const sipWSStore = useSipWSStore();

  function setContact(id, contact) {
    if (sipStore.sessions[id]) {
      sipStore.setSessionContact(id, contact);
    } else if (sipWSStore.passiveCalls[id]) {
      sipWSStore.passiveCalls[id].contact = contact;
    }
  }

  async function newContact(phone, id) {
    setContact(id, 'waiting_for_the_value');

    const { created, contact } = await contactsStore.createContactIfMissing(phone);

    if ((created === 'yes' || created === 'no') && contact) {
      setContact(id, { contact_page_link: contact.contact_page_link, name: contact.name });
      if (created === 'yes') {
        contactsStore.openWidgetPage(contact.contact_page_link);
      }
    } else {
      setContact(id, null);
    }
  }

  // kept for backward-compat with onBeforeUnmount calls in card components
  function clearRetry() {}

  return { newContact, clearRetry };
}
