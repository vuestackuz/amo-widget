import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import amo_endpoints from "./amoEndpoints";
import { useHelpersStore } from "../helpers";
import logger from "../../src/composables/logger";

export const useContactsStore = defineStore("amo-contacts", () => {
  const helpersStore = useHelpersStore();

  const all_contacts = ref([]);

  async function getAllContacts() {
    helpersStore.amo_api_loading = true;
    try {
      const response = await axios.get(amo_endpoints.Contacts);
      const contacts = response.data._embedded.contacts;
      all_contacts.value = contacts.map((contact) => {
        return {...contact, contact_page_link:  `${amo_endpoints.Domain}/contacts/detail/${contact.id}`}
      });
    } catch (error) {
      logger.error("Error when getting all contacts from Amo API:", error);
    }
    helpersStore.amo_api_loading = false;
  }

  // Search contact by phone number
  async function findContactByPhone(phone) {
    try {
      const res = await axios.get(
        `${amo_endpoints.Contacts}?query=${encodeURIComponent(phone)}`
      );
      const contacts = res.data?._embedded?.contacts || [];
      return contacts.length > 0 ? {...contacts[0], contact_page_link:  `${amo_endpoints.Domain}/contacts/detail/${contacts[0].id}`} : null;
    } catch (err) {
      logger.error(`Error searching contact by phone(${phone}):`, err);
      return null;
    }
  }

  function openWidgetPage(link) {
    helpersStore.closeModal()
    if (window.AMOCRM && window.AMOCRM.router) {
      // Navigate safely inside AMOCRM SPA
      const parts = link.split('/');
      const id = parts[parts.length - 1];
      window.AMOCRM.router.navigate(`/contacts/detail/${id}`, { trigger: true });
    } else {
      // Fallback: open in new tab
      window.open(link, '_self')
    }
  }

  async function createContactIfMissing(phone) {
    const contactCheck = await findContactByPhone(phone);

    if (contactCheck === null) {
      try {
        const body = [
          {
            "name": `Контакт: "${phone}"`,
            "custom_fields_values": [
              {
                "field_code": "PHONE",
                "values": [{ "value": phone }]
              }
            ]
          },
        ];

        const response = await axios.post(amo_endpoints.Contacts, body);

        const created = response.data?._embedded?.contacts?.[0];
        openWidgetPage(`${amo_endpoints.Domain}/contacts/detail/${created.id}`)
        return {
          created: "yes",
          contact: created,
        };
      } catch (error) {
        logger.error("Error creating contact:", error);
        return {
          created: "error",
          contact: null,
        };
      }
    }
    return {
      created: "no",
      contact: contactCheck,
    };
  }

  return {
    all_contacts,
    getAllContacts,
    findContactByPhone,
    createContactIfMissing,
    openWidgetPage
  };
});
