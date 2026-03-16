import { defineStore } from 'pinia';
import JsSIP from 'jssip';
import { computed, ref, markRaw } from 'vue';
import { useAmocrmStore } from './amocrm.store';
import { useAudio } from '../composables/useAudio';
import { checkMicAccess } from '../composables/useMic';

export const useSipStore = defineStore('sip', () => {
  const amocrmStore = useAmocrmStore();

  const sessions = ref({});
  let ua = null;

  const isRegistered = ref(false);
  const dnd = ref(false);
  const multiChannel = ref(true);
  const order = ref(0);

  const liveCalls = computed(() => Object.keys(sessions.value).length);
  const hasCredential = computed(() => !!amocrmStore.sipUser?.credential);

  const { audio, play: playAudio, pause: pauseAudio } = useAudio();

  // --- DND / MultiChannel ---
  function setDND(flag) {
    dnd.value = flag;
    console.log(`[SIP] DND ${flag ? 'ON' : 'OFF'}`);
  }

  function setMultiChannel(flag) {
    multiChannel.value = flag;
    console.log(`[SIP] MultiChannel ${flag ? 'ON' : 'OFF'}`);
  }

  // --- Init UA ---
  function initSip() {
    const { websocket, sipUser } = amocrmStore;

    if (!websocket || !sipUser?.credential) {
      console.warn('[SIP] Missing websocket or sip credentials — skipping UA init');
      return;
    }

    if (ua) {
      ua.stop();
      ua = null;
    }

    // Build WebSocket URL: strip protocol from settings domain
    // Port 443 is the default for WSS — omit it to avoid server rejection
    const settingsDomain = window.__AMO_UTEL_WIDGET_SETTINGS__.domain;
    const host = settingsDomain.replace(/^https?:\/\//, '');
    const wsUrl = `wss://${host}:8089/ws/`;

    const username = sipUser.credential.username;
    const password = sipUser.credential.password;

    console.log(`[SIP] Connecting — wsUrl: ${wsUrl} | uri: sip:${username}@${host}`);

    const socket = new JsSIP.WebSocketInterface(wsUrl);

    ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${username}@${host}`,
      password,
      register: true,
      session_timers: false,
      user_agent: 'AmoCRM-Widget',
    });

    ua.on('connected', () => console.log('[SIP] Connected to SIP server.'));
    ua.on('disconnected', () => console.log('[SIP] Disconnected from SIP server.'));
    ua.on('registered', () => {
      isRegistered.value = true;
      console.log('[SIP] Registered.');
    });
    ua.on('unregistered', () => {
      isRegistered.value = false;
      console.log('[SIP] Unregistered.');
    });
    ua.on('registrationFailed', (e) => {
      isRegistered.value = false;
      console.error('[SIP] Registration failed:', e.cause);
    });

    ua.on('newRTCSession', async ({ originator, session }) => {
      order.value++;
      const id = session.id || `sess_${Date.now()}`;

      const { ringtone, endCall: callEndSound } = audio;

      // DND — reject before storing session
      if (originator === 'remote' && dnd.value) {
        console.log(`[SIP] DND — rejecting call from ${session.remote_identity.uri.user}`);
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
      };

      // Call duration timer
      sessions.value[id].timer = setInterval(() => {
        sessions.value[id].duration = Math.floor(
          (Date.now() - sessions.value[id].startTime.getTime()) / 1000
        );
      }, 1000);

      console.log(`[SIP] New session from ${originator}: ${session.remote_identity.uri.toString()}`);

      if (originator === 'remote') {
        playAudio(ringtone, true);
      }

      // Attach remote audio track to a programmatic Audio node
      const remoteAudio = new Audio();
      function attachRemoteAudio() {
        const pc = session.connection;
        if (!pc) return;
        const tracks = pc.getReceivers()
          .map((r) => r.track)
          .filter((t) => t?.kind === 'audio');
        if (!tracks.length) return;
        remoteAudio.srcObject = new MediaStream(tracks);
        remoteAudio.play().catch(() => {});
      }

      function cleanupCall(cause = 'Unknown') {
        console.log(`[SIP] Call ended — id=${id} cause=${cause}`);
        pauseAudio(ringtone);
        remoteAudio.srcObject = null;
        playAudio(callEndSound, false);
        if (sessions.value[id]?.timer) clearInterval(sessions.value[id].timer);
        delete sessions.value[id];
      }

      session.on('accepted', () => {
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
        pauseAudio(ringtone);
      });

      session.on('confirmed', () => {
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
      });

      session.on('ended', (data) => {
        sessions.value[id].endTime = new Date();
        cleanupCall(data?.cause || 'ended');
      });

      session.on('failed', (data) => {
        sessions.value[id].endTime = new Date();
        cleanupCall(data?.cause || 'failed');
      });

      session.on('hold', () => { sessions.value[id].isOnHold = true; });
      session.on('unhold', () => { sessions.value[id].isOnHold = false; });
      session.on('remotehold', () => { sessions.value[id].isOnHold = true; });
      session.on('remoteunhold', () => { sessions.value[id].isOnHold = false; });
      session.on('muted', () => { sessions.value[id].isMuted = true; });
      session.on('unmuted', () => { sessions.value[id].isMuted = false; });

      session.on('referred', () => { delete sessions.value[id]; });
    });

    ua.start();
    console.log('[SIP] UA started.');
  }

  // --- Stop UA ---
  function stopSip() {
    if (ua) {
      ua.stop();
      ua = null;
    }
    console.log('[SIP] UA stopped.');
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

    const host = window.__AMO_UTEL_WIDGET_SETTINGS__.domain.replace(/^https?:\/\//, '');
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
            console.log('[SIP] Call ended:', e.cause);
            pauseAudio(dialingSound);
            playAudio(callEndSound);
          },
        },
      });

      // Put other active calls on hold
      Object.values(sessions.value).forEach((s) => {
        if (s.id !== session.id) s.raw.hold();
      });

      console.log(`[SIP] Outgoing call initiated to ${target}`);
      return session;
    } catch (err) {
      console.error('[SIP] Error initiating call:', err);
      return null;
    }
  }

  return {
    sessions,
    liveCalls,
    hasCredential,
    isRegistered,
    dnd,
    setDND,
    multiChannel,
    setMultiChannel,
    order,
    initSip,
    stopSip,
    makeCall,
  };
});
