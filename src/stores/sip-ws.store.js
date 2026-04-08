import { defineStore } from 'pinia';
import { markRaw, ref, watch } from 'vue';
import axios from 'axios';
import Pusher from 'pusher-js';
import Echo from 'laravel-echo';
import { useAmocrmStore } from './amocrm.store';
import { useUtelSipUserStore } from './sip-user.store';
import { useSipStore } from './sip.store';
import { useAmoCallsStore } from './amo-calls.store';
import { useContactsStore } from './contacts.store';
import { toast } from 'vue3-toastify';

export const useSipWSStore = defineStore('sipWS', () => {
  const passiveCalls = ref({});
  const echo = ref(null);
  const isConnecting = ref(false);

  window.Pusher = Pusher;

  // --- Echo connection ---

  function init() {
    const sipUserStore = useUtelSipUserStore();

    if (sipUserStore.sipUser?.attached && !sipUserStore.sipUser?.credentials) {
      const amocrmStore = useAmocrmStore();
      const websocket = amocrmStore.websocket;

      const settings = window.__AMO_UTEL_WIDGET_SETTINGS__;
      const system = window.__AMO_UTEL_WIDGET_SYSTEM__;
      const hostname = settings?.domain?.replace(/^https?:\/\//, '');

      if (!hostname || !settings?.token || !system?.amouser_id || !websocket) {
        console.warn('[SipWS] Missing required config — skipping Echo connection');
        return;
      }

      console.log('[SipWS] Connecting to ws for Sip statuses...');
      isConnecting.value = true;

      echo.value = new Echo({
        broadcaster: 'reverb',
        key: websocket.key,
        wsHost: websocket.host,
        wsPort: websocket.ws_port,
        wssPort: websocket.wss_port,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel) => ({
          authorize: (socketId, callback) => {
            axios
              .post(
                `https://${hostname}/api/broadcasting/auth`,
                { socket_id: socketId, channel_name: channel.name },
                {
                  headers: {
                    Authorization: `Bearer ${settings.token}`,
                    'Amocrm-User-Id': system.amouser_id,
                  },
                }
              )
              .then((response) => callback(false, response.data))
              .catch((error) => {
                callback(true, error);
                console.error('[SipWS] socket_connection_error', error);
              });
          },
        }),
      });

      echo.value.connector.pusher.connection.bind('connected', () => { isConnecting.value = false; });
      echo.value.connector.pusher.connection.bind('failed', () => { isConnecting.value = false; });
      echo.value.connector.pusher.connection.bind('unavailable', () => { 
        toast(`Не удалось подключиться к сокету`, { type: 'error', autoClose: 4000, position: toast.POSITION.BOTTOM_RIGHT });
       });
    }
  }

  // --- Passive call helpers ---

  function startPassiveTimer(id) {
    if (passiveCalls.value[id]?.timer) return;

    passiveCalls.value[id].timer = setInterval(() => {
      const sess = passiveCalls.value[id];
      if (!sess?.startTime) return;
      sess.duration = Math.floor((Date.now() - new Date(sess.startTime).getTime()) / 1000);
    }, 1000);
  }

  function sipCheck(e) {
    const amocrmStore = useAmocrmStore();
    const attached = amocrmStore.sipUser?.attached;
    const caller = e?.call?.cdr?.src;
    const callee = e?.call?.cdr?.dst;

    if (caller == attached) return [callee, 'outgoing'];
    if (callee == attached) return [caller, 'incoming'];
    return null;
  }

  function resolveCallStatus(direction, isAccepted) {
    return direction === 'outgoing' ? (isAccepted ? 4 : 3) : (isAccepted ? 1 : 2);
  }

  function closePassiveCall(id) {
    const sess = passiveCalls.value[id];
    if (!sess) return;

    sess.endTime = new Date();
    clearInterval(sess.timer);
    sess.timer = null;
    sess.duration = Math.max(
      0,
      Math.floor((sess.endTime.getTime() - new Date(sess.startTime).getTime()) / 1000)
    );

    useAmoCallsStore().addCall({
      id,
      direction: sess.direction,
      number: sess.number,
      displayName: sess.displayName,
      duration: sess.duration,
      startTime: new Date(sess.startTime).toISOString(),
      endTime: sess.endTime.toISOString(),
      status: resolveCallStatus(sess.direction, sess.isAccepted),
      contact: sess.contact,
    });

    delete passiveCalls.value[id];
  }

  async function handleEvent(e, status) {
    const id = e?.call?.id;
    const check = sipCheck(e);
    if (!id || !check) return;

    const [number, direction] = check;
    const contact = await useContactsStore().findContactByPhone(number);
    const contactInfo = contact
      ? { contact_page_link: contact.contact_page_link, name: contact.name }
      : null;

    if (status) {
      if (!passiveCalls.value[id]) {
        const sipStore = useSipStore();
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
        startPassiveTimer(id);
      } else {
        passiveCalls.value[id].status = status;
        passiveCalls.value[id].isAccepted = status === 'answered';
        passiveCalls.value[id].contact = contactInfo;
      }
    } else {
      closePassiveCall(id);
    }
  }

  function handleBlindTransferred(e) {
    const attached = useAmocrmStore().sipUser?.attached;
    const caller = e?.channel?.caller?.number;
    if (Number(caller) === attached) {
      closePassiveCall(e?.call?.id);
    }
  }

  // --- Channel subscription — fires once echo is connected ---

  watch(echo, () => {
    if (!echo.value) return;

    const amocrmStore = useAmocrmStore();
    const channel = amocrmStore.websocket?.channel;
    if (!channel) {
      console.warn('[SipWS] No channel name in websocket config');
      return;
    }

    echo.value
      .channel(channel)
      .on('App\\Events\\Webhook\\CallStarted',  (e) => handleEvent(e, 'new_call'))
      .on('App\\Events\\Webhook\\DialStarted',   (e) => handleEvent(e, 'calling'))
      .on('App\\Events\\Webhook\\DialAnswered',  (e) => handleEvent(e, 'answered'))
      .on('App\\Events\\Webhook\\BlindTransferred', (e) => handleBlindTransferred(e))
      .on('App\\Events\\Webhook\\DialEnded',     (e) => handleEvent(e, null))
      .on('App\\Events\\Webhook\\CallSaved',     (e) => handleEvent(e, null))
      .on('App\\Events\\Webhook\\CallEnded',     (e) => handleEvent(e, null));
  }, { immediate: true });

  // --- Disconnect ---

  function disconnect() {
    if (echo.value) {
      echo.value.disconnect();
      echo.value = null;
    }
    passiveCalls.value = {};
  }

  return { echo, passiveCalls, isConnecting, init, disconnect };
});
