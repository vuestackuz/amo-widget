import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import axios from "axios";
import amo_endpoints from "./amoEndpoints";
import { useHelpersStore } from "../helpers";
import { useContactsStore } from "./contacts";
import logger from "../../src/composables/logger";

export const useAmoCallsStore = defineStore("amo-calls", () => {
  const helpersStore = useHelpersStore();
  const contactsStore = useContactsStore()

  const calls = ref([]);

  if (localStorage.getItem('utel-widget-calls')) {
    try {
      calls.value = JSON.parse(localStorage.getItem('utel-widget-calls'));
    } catch (err) {
      logger.error("Corrupted calls cache:", err);
      calls.value = [];
    }
  }
  
  watch(calls, () => {
    try {
      if(calls.value.length > 1000) {
        calls.value.splice(1000);
      }
      localStorage.setItem('utel-widget-calls', JSON.stringify(calls.value));
    } catch (err) {
      logger.error("Failed to save calls:", err);
    }
  }, { deep: true });

  function mapSipCauseToAmoStatus(cause, isAccepted) {
    if (isAccepted) return [4, "Разговор состоялся"]; // разговор состоялся

    if (!cause) return [6, "Не дозвонился"]; // Не дозвонился

    cause = cause.toLowerCase();

    if (cause.includes("busy")) return [7, "Занято"];           // номер занят
    if (cause.includes("no_answer")) return [6, "Нет ответа"];      // не дозвонился
    if (cause.includes("failed")) return [6, "Не удалось"];         // не дозвонился
    if (cause.includes("rejected")) return [6, "Отклонено"];       // не дозвонился
    if (cause.includes("unavailable")) return [3, "Недоступно"];    // нет на месте

    return [6, "Не дозвонился"]; // default: не дозвонился
  }

  async function endedCallInfoPost(amoCRMUserId, session) {
    helpersStore.amo_api_loading = true;

    try {
      // Calculate duration
      let duration = 0;
      if (session.startTime && session.endTime) {
        duration = Math.floor((session.endTime - session.startTime) / 1000);
      }

      // direction
      const direction =
        session.direction === "incoming"
          ? "inbound"
          : session.direction === "outgoing"
          ? "outbound"
          : "unknown";

      // call_status
      const call_status = mapSipCauseToAmoStatus(session.cause, session.isAccepted);

      const contact = await contactsStore.findContactByPhone(session.number)
      let contactInfo = null
      if(contact !== null) {
        contactInfo = {
          contact_page_link: contact.contact_page_link,
          name: contact.name,
        }
      }
      
      calls.value.unshift({
        id: session.id,
        order: session.order,
        displayName: session.displayName,
        call_status: call_status,
        direction: session.direction,
        number: session.number,
        startTime: session.startTime,
        endTime: session.endTime,
        contact: contactInfo,
        duration: session.duration,
        isAccepted: session.isAccepted,
      })

      // UTeL backend does the call info post process!
      // if(session.number.length > 5) {
      //   callInfoPost([{
      //     duration: duration,
      //     source: "Utel",
      //     phone: session.number,
      //     direction: direction,
      //     call_result: session.isAccepted ? "successful" : "missed",
      //     call_status: call_status[0],
      //     call_responsible: amoCRMUserId
      //   }])
      // }

    } catch (error) {
      logger.error("Error when adding the new ended call:", error);
    }

    helpersStore.amo_api_loading = false;

  }

  // Formatting and adding contact info:

  const tabs = ref([
    {
      name: "Все",
      active: true,
    },
    {
      name: "Входящие",
      active: false,
    },
    {
      name: "Исходящие",
      active: false,
    },
    {
      name: "Пропущенные",
      active: false,
    },
  ])

  const formattedCalls = computed(() => {
    const activeTab = tabs.value.filter(item => item.active)[0].name
    switch(activeTab) {
      case "Входящие":
        return calls.value.filter(item => item.direction === 'incoming')
      case "Исходящие":
        return calls.value.filter(item => item.direction === 'outgoing')
      case "Пропущенные":
        return calls.value.filter(item => item.direction === 'incoming' && !item.isAccepted)
      case "Все":
      default:
        return calls.value;
    }
  })

  async function reAddContactInfo() {
    const numbers = [...new Set(calls.value.map(call => call.number))]

    const contacts = {}

    for (const number of numbers) {
      const gotContact = await contactsStore.findContactByPhone(number);
      let contactInfo = null;
      if (gotContact !== null) {
        contactInfo = {
          contact_page_link: gotContact.contact_page_link,
          name: gotContact.name ?? "",
        };
      }
      contacts[number] = contactInfo;
    }
    
    for (let i = 0; i < calls.value.length; i++) {
      calls.value[i].contact = contacts[calls.value[i].number];
    }
  }

  return {
    tabs,
    calls,
    formattedCalls,
    endedCallInfoPost,
    reAddContactInfo,
    mapSipCauseToAmoStatus,
  };
});
