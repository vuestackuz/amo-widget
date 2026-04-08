import { defineStore } from 'pinia';
import JsSIP from 'jssip';
import { computed, ref, markRaw } from 'vue';
import { useAmocrmStore } from './amocrm.store';
import { useAudio } from '../composables/useAudio';
import { checkMicAccess } from '../composables/useMic';
import { useAmoCallsStore } from './amo-calls.store';
import { toast } from 'vue3-toastify';


export const useSipStore = defineStore('sip', () => {
  const amocrmStore = useAmocrmStore();

  const sessions = ref({});
  let ua = null;

  const isRegistered = ref(false);
  const isConnecting = ref(false);
  const dnd = ref(false);
  const multiChannel = ref(true);
  const order = ref(0);

  const liveCalls = computed(() => Object.keys(sessions.value).length);
  const hasCredential = computed(() => !!amocrmStore.sipUser?.credential);
  const hasAttached = computed(() => !!amocrmStore.sipUser?.attached);

  const { audio, play: playAudio, pause: pauseAudio } = useAudio();

  // --- DND / MultiChannel ---
  function setDND(flag) {
    dnd.value = flag;
  }

  function setMultiChannel(flag) {
    multiChannel.value = flag;
  }

  // --- Init UA ---
  function initSip() {
    const { websocket, sipUser } = amocrmStore;

    if (!websocket || !sipUser?.credential) {
      console.warn('[SIP] Missing websocket or SIP credentials — skipping UA init');
      return;
    }

    if (ua) {
      ua.stop();
      ua = null;
    }

    const settingsDomain = window.__AMO_UTEL_WIDGET_SETTINGS__?.domain;
    if (!settingsDomain) {
      console.warn('[SIP] Widget settings domain not found — skipping UA init');
      return;
    }

    const host = settingsDomain.replace(/^https?:\/\//, '');
    const wsUrl = sipUser.webrtc_url;
    const username = sipUser.credential.username;
    const password = sipUser.credential.password;

    const socket = new JsSIP.WebSocketInterface(wsUrl);

    ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${username}@${host}`,
      password,
      register: true,
      session_timers: false,
      user_agent: 'AmoCRM-Widget',
    });

    isConnecting.value = true;

    ua.on('connected', () => { playAudio(audio.connected) });
    ua.on('disconnected', (e) => { 
      playAudio(audio.disconnected); 
      toast(`Не удалось подключиться к сокету`, { type: 'error', autoClose: 4000, position: toast.POSITION.BOTTOM_RIGHT });
    });
    ua.on('registered', () => { isRegistered.value = true; isConnecting.value = false; });
    ua.on('unregistered', () => { isRegistered.value = false; console.log('unregistered'); });
    ua.on('registrationFailed', (e) => {
      isRegistered.value = false;
      isConnecting.value = false;
      console.error('[SIP] Registration failed:', e.cause);
    });

    ua.on('newRTCSession', async ({ originator, session }) => {
      order.value++;
      const id = session.id || `sess_${Date.now()}`;

      const { ringtone, endCall: callEndSound } = audio;

      // DND — reject before storing session
      if (originator === 'remote' && dnd.value) {
        session.terminate({ status_code: 486, reason_phrase: 'Do Not Disturb' });
        return;
      }

      // No multichannel — reject if already in a call
      if (originator === 'remote' && !multiChannel.value && Object.keys(sessions.value).length) {
        session.terminate({ status_code: 486, reason_phrase: 'MultiChannel is off' });
        return;
      }

      // Store session state
      sessions.value[id] = {
        id: session.id,
        order: order.value,
        direction: session.direction,
        timer: null,
        isAccepted: false,
        duration: 0,
        talkTimer: null,
        talkDuration: 0,
        talkStartTime: null,
        displayName:
          session.remote_identity?._display_name ||
          session.remote_identity?.uri?.user ||
          'Unknown',
        number: session.remote_identity?.uri?.user || null,
        raw: markRaw(session),
        startTime: new Date(),
        endTime: null,
        isMuted: false,
        isOnHold: false,
        isRemoteHold: false,
        contact: null,
        passiveCall: false,
      };

      // Call duration timer
      sessions.value[id].timer = setInterval(() => {
        if (sessions.value[id]) {
          sessions.value[id].duration = Math.floor(
            (Date.now() - sessions.value[id].startTime.getTime()) / 1000
          );
        }
      }, 1000);

      if (originator === 'remote') {
        playAudio(ringtone, true);
      }

      // Attach remote audio track
      const remoteAudio = new Audio();
      function attachRemoteAudio(attempt = 0) {
        const pc = session.connection;
        if (!pc) return;
        const tracks = pc.getReceivers()
          .map((r) => r.track)
          .filter((t) => t?.kind === 'audio');
        if (!tracks.length) {
          if (attempt < 5) setTimeout(() => attachRemoteAudio(attempt + 1), 200);
          return;
        }
        remoteAudio.srcObject = new MediaStream(tracks);
        remoteAudio.play().catch(() => {});
      }

      function startTalkTimer() {
        const sess = sessions.value[id];
        if (!sess || sess.talkTimer) return;
        sess.talkStartTime = new Date();
        sess.talkTimer = setInterval(() => {
          if (sessions.value[id]) {
            sessions.value[id].talkDuration = Math.floor(
              (Date.now() - sessions.value[id].talkStartTime.getTime()) / 1000
            );
          }
        }, 1000);
      }

      function cleanupCall(cause = 'Unknown') {
        const sess = sessions.value[id];
        if (sess) {
          const isAccepted = sess.isAccepted;
          const direction = sess.direction;
          let status;
          if (direction === 'outgoing') status = isAccepted ? 4 : 3;
          else status = isAccepted ? 1 : 2;

          useAmoCallsStore().addCall({
            id: sess.id,
            direction,
            number: sess.number,
            displayName: sess.displayName,
            duration: sess.duration,
            talkDuration: sess.talkDuration,
            startTime: sess.startTime?.toISOString() ?? null,
            endTime: new Date().toISOString(),
            status,
            contact: sess.contact,
          });

          clearInterval(sess.timer);
          clearInterval(sess.talkTimer);
        }
        pauseAudio(ringtone);
        remoteAudio.srcObject = null;
        remoteAudio.src = '';
        playAudio(callEndSound, false);
        delete sessions.value[id];
        console.warn(`[SIP] Call ended — id=${id} cause=${cause}`);
      }

      session.on('accepted', () => {
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
        pauseAudio(ringtone);
        startTalkTimer();
      });

      session.on('confirmed', () => {
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
        startTalkTimer();
      });

      session.on('ended', (data) => {
        if (sessions.value[id]) sessions.value[id].endTime = new Date();
        cleanupCall(data?.cause || 'ended');
      });

      session.on('failed', (data) => {
        if (sessions.value[id]) sessions.value[id].endTime = new Date();
        cleanupCall(data?.cause || 'failed');
      });

      session.on('hold', () => { if (sessions.value[id]) sessions.value[id].isOnHold = true; });
      session.on('unhold', () => { if (sessions.value[id]) sessions.value[id].isOnHold = false; });
      session.on('remotehold', () => { if (sessions.value[id]) sessions.value[id].isRemoteHold = true; });
      session.on('remoteunhold', () => { if (sessions.value[id]) sessions.value[id].isRemoteHold = false; });
      session.on('muted', () => { if (sessions.value[id]) sessions.value[id].isMuted = true; });
      session.on('unmuted', () => { if (sessions.value[id]) sessions.value[id].isMuted = false; });

      session.on('referred', () => { delete sessions.value[id]; });
    });

    ua.start();
  }

  // --- Session contact ---
  function setSessionContact(id, contact) {
    if (!sessions.value[id]) return;
    sessions.value[id].contact = {
      contact_page_link: contact.contact_page_link,
      name: contact.name,
    };
  }

  // --- Stop UA ---
  function stopSip() {
    if (ua) {
      ua.stop();
      ua = null;
    }
  }

  // --- Outgoing call ---
  async function makeCall(targetNumber) {
    const micOk = await checkMicAccess();
    if (!micOk) {
      alert('Доступ к микрофону заблокирован браузером. Пожалуйста, разрешите доступ к микрофону, чтобы совершить звонок.');
      return null;
    }

    if (!ua || !isRegistered.value) {
      console.warn('[SIP] Cannot call — UA not ready or not registered');
      return null;
    }

    if (!targetNumber) {
      console.warn('[SIP] No target number provided');
      return null;
    }

    const host = window.__AMO_UTEL_WIDGET_SETTINGS__?.domain?.replace(/^https?:\/\//, '');
    if (!host) {
      console.warn('[SIP] Widget settings domain not found');
      return null;
    }

    const target = `sip:${targetNumber}@${host}`;
    const { dialing: dialingSound, endCall: callEndSound } = audio;

    try {
      const session = ua.call(target, {
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
        eventHandlers: {
          progress() { playAudio(dialingSound, true); },
          confirmed() { pauseAudio(dialingSound); },
          failed(e) {
            console.warn('[SIP] Call failed:', e.cause);
            pauseAudio(dialingSound);
            playAudio(callEndSound);
          },
          ended(e) {
            console.warn('[SIP] Call ended:', e.cause);
            pauseAudio(dialingSound);
            playAudio(callEndSound);
          },
        },
      });

      // Put other active calls on hold
      Object.values(sessions.value).forEach((s) => {
        if (s.id !== session.id) s.raw.hold();
      });

      return session;
    } catch (err) {
      console.error('[SIP] Error initiating call:', err);
      return null;
    }
  }

  function holdAllCalls() {
    Object.values(sessions.value).forEach((s) => {
      if (s.isAccepted && !s.isOnHold) s.raw.hold();
    });
  }

  return {
    sessions,
    liveCalls,
    hasCredential,
    isRegistered,
    isConnecting,
    dnd,
    setDND,
    multiChannel,
    setMultiChannel,
    order,
    initSip,
    stopSip,
    makeCall,
    holdAllCalls,
    setSessionContact,
    hasAttached,
  };
});
