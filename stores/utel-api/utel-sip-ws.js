// =⭐=
//  THIS STORE HAS MAIN WS ECHO VALUE WITH ITS AUTHENTICATION ON CONNECTION.
// =⭐=

import { defineStore } from 'pinia'
import { computed, markRaw, ref, watch } from 'vue'
import axios from 'axios'
import Pusher from 'pusher-js'
import Echo from 'laravel-echo'
import { useUtelSipUserStore } from './sipUser'
import { useGlobalsStore } from '../globals'
import { useSipStore } from '../js-sip/sipStore'
import { useAmoCallsStore } from '../amo-api/amo-calls'
import { useContactsStore } from '../amo-api/contacts'
import logger from '../../src/composables/logger'

export const useSipWSStore = defineStore('sip-ws-store', () => {
  const sipUser = useUtelSipUserStore()
  const sipStore = useSipStore()
  const globals = useGlobalsStore()
  const amoCallsStore = useAmoCallsStore()
  const contactsStore = useContactsStore()

  window.Pusher = Pusher
  const echo = ref(null)

  const sipConditions = computed(() => ({
    a: sipUser.notConnectedSipUser,
    b: sipUser.noOtherSoftPhoneConnection
  }))

  // Creating an echo connection with the server depending on the sip user status:
  watch(() => sipUser.noOtherSoftPhoneConnection,
    () => {
      if ([3, 4, 5].includes(sipUser.noOtherSoftPhoneConnection)) {
        if(globals.hostname !== null && globals.settings?.token && globals.system?.amouser_id ) {
          logger.log("Connecting to ws for Sip statuses...");
          echo.value = new Echo({
            broadcaster: 'reverb',
            key: sipUser.sipUser_websocket.key,
            wsHost: globals.hostname,
            wsPort: sipUser.sipUser_websocket.ws_port,
            wssPort: sipUser.sipUser_websocket.wss_port,
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
            authorizer: (channel) => {
              return {
                authorize: (socketId, callback) => {
                  axios
                    .post("https://" + globals.hostname+'/api/broadcasting/auth',
                      {
                        socket_id: socketId,
                        channel_name: channel.name
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${globals.settings.token}`,
                          'Amocrm-User-Id': globals.system.amouser_id
                        }
                      }
                    )
                    .then((response) => {
                      callback(false, response.data)
                    })
                    .catch((error) => {
                      callback(true, error)
                      logger.error("socket_connection_error", error);
                    })
                }
              }
            }
          })
        }
      }
    },
    { immediate: true } // this will change watch function in way that it will be executed on this store's initial run
  )

  const passiveCalls = ref({})
  
  
  function startPassiveTimer(id) {
    if (passiveCalls.value[id]?.timer) return;

    passiveCalls.value[id].timer = setInterval(() => {
      const start = new Date(passiveCalls.value[id].startTime).getTime();
      passiveCalls.value[id].duration =
        Math.floor((Date.now() - start) / 1000);
    }, 1000);
  }


  function sipCheck(e) {
    const caller = e?.call?.cdr?.src;
    const callee = e?.call?.cdr?.dst;
    if (caller == sipUser.sipUser?.attached) {
      return [callee, 'outgoing'];
    }
    if (callee == sipUser.sipUser?.attached) {
      return [caller, 'incoming'];
    }
    return null;
  }

  function startCallTimer() {
    if (passiveCalls.value[id].timer) return;

    // Make sure startTime is a Date object
    if (!passiveCalls.value[id].startTime) {
      passiveCalls.value[id].startTime = new Date()
    }

    passiveCalls.value[id].timer = setInterval(() => {
      if (!passiveCalls.value[id].startTime) return
      passiveCalls.value[id].duration =
        Math.floor((Date.now() - passiveCalls.value[id].startTime.getTime()) / 1000);
    }, 1000);
  }


 async function handleEvent(e, status) {
  const id = e?.call?.id;
  const check = sipCheck(e);
  if (!id || !check) return;

  const [number, direction] = check;
  const contact = await contactsStore.findContactByPhone(number);
  const contactInfo = contact
    ? { contact_page_link: contact.contact_page_link, name: contact.name }
    : null;

  if (status) {
    if (!passiveCalls.value[id]) {
      // First time we see this call
      sipStore.order++;
      passiveCalls.value[id] = {
        id,
        passiveCall: true,
        number,
        direction,
        status,
        order: sipStore.order,
        duration: 0,
        timer: null,
        startTime: new Date(),
        endTime: null,
        isAccepted: status === 'answered',
        raw: markRaw(e),
        displayName: number,
        contact: contactInfo,
      };
      startPassiveTimer(id); // start timer immediately
    } else {
      // Update existing call without overwriting startTime
      passiveCalls.value[id].status = status;
      passiveCalls.value[id].isAccepted = status === 'answered';
      passiveCalls.value[id].contact = contactInfo;
    }
  } else {
    // Call ended
    if (!passiveCalls.value[id]) return;

    passiveCalls.value[id].endTime = new Date();

    if (passiveCalls.value[id].timer) {
      clearInterval(passiveCalls.value[id].timer);
      passiveCalls.value[id].timer = null;
    }

    const start = passiveCalls.value[id].startTime.getTime();
    const end = passiveCalls.value[id].endTime.getTime();
    passiveCalls.value[id].duration = Math.max(0, Math.floor((end - start) / 1000));

    const call_status = amoCallsStore.mapSipCauseToAmoStatus(
      null,
      passiveCalls.value[id].isAccepted
    );

    amoCallsStore.calls.unshift({
      id,
      order: passiveCalls.value[id].order,
      displayName: passiveCalls.value[id].displayName,
      call_status,
      direction: passiveCalls.value[id].direction,
      number: passiveCalls.value[id].number,
      startTime: passiveCalls.value[id].startTime,
      endTime: passiveCalls.value[id].endTime,
      contact: contactInfo,
      duration: passiveCalls.value[id].duration,
      isAccepted: passiveCalls.value[id].isAccepted,
    });

    delete passiveCalls.value[id];
  }
}



  watch(
    echo,
    () => {
      if (echo.value) {
        echo.value.channel(sipUser.sipUser_websocket.channel)
          .on('App\\Events\\Webhook\\CallStarted', e => handleEvent(e, "new_call"))
          .on('App\\Events\\Webhook\\DialStarted', e => handleEvent(e, "calling"))
          .on('App\\Events\\Webhook\\DialAnswered', e => handleEvent(e, "answered"))
          .on('App\\Events\\Webhook\\DialEnded', e => handleEvent(e, null))
          .on('App\\Events\\Webhook\\CallSaved', e => handleEvent(e, null))
          .on('App\\Events\\Webhook\\CallEnded', e => handleEvent(e, null))
      }
    },
    { immediate: true }
  )


  return {
    echo,
    passiveCalls
  }
})
