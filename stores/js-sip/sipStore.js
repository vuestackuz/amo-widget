import { defineStore } from 'pinia'
import JsSIP from "jssip"
import { computed, ref, watch } from "vue"
import { markRaw } from "vue"
import { useGlobalsStore } from '../globals'
import { useAmoCallsStore } from '../amo-api/amo-calls'
import { useContactsStore } from '../amo-api/contacts'
import { useMicControlStore } from '../micControl'
import logger from '../../src/composables/logger'

export const useSipStore = defineStore('sip', () => {
  const globals = useGlobalsStore()
  const amoCallsStore = useAmoCallsStore()
  const contactsStore = useContactsStore()
  const micControlStore = useMicControlStore()

  const sessions = ref({}) // call sessions
  let ua = null // Sip User Agent

  const dnd = ref(false)
  function setDND(flag) {
    dnd.value = flag;
    logger.log(`[DND] ${dnd.value ? "ON" : "OFF"}`);
  }
  
  const multiChannel = ref(true)
  function setMultiChannel(flag) {
    multiChannel.value = flag;
    logger.log(`[MultiChannel] ${multiChannel.value ? "ON" : "OFF"}`);
  }
  
  const order = ref(0)

  const liveCalls = computed(() => Object.keys(sessions.value).length)


  function playAudio(audioEl, loop = false) {
    if (!audioEl) return;
    audioEl.currentTime = 0;
    audioEl.loop = loop;
    audioEl.play().catch(err => logger.warn("Audio play failed:", err));
  }

  function pauseAudio(audioEl) {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  // Initialization:
  function initSip(sipNumber, sipPassword, UTeLDomain) {
    const socket = new JsSIP.WebSocketInterface(`wss://${UTeLDomain}:8089/ws`);

    ua = new JsSIP.UA({
      uri: `sip:${sipNumber}@${UTeLDomain}`,
      password: sipPassword,
      sockets: [socket],
      register: true,
      session_timers: false,
      user_agent: 'AmoCRM-Widget'
    });

    ua.start();
    logger.log('JsSIP UA started.');

    const ringtone = document.getElementById("utel-ringtone")
    const callEndSound = document.getElementById("utel-end-call-sound-effect")

    // --- UA events ---
    ua.on('connected', () => logger.log('Connected to SIP server.'));
    ua.on('disconnected', () => logger.log('Disconnected from SIP server.'));
    ua.on('registered', () => logger.log('SIP Registered.'));
    ua.on('unregistered', () => logger.log('SIP Unregistered.'));
    ua.on('registrationFailed', (e) => logger.log('Registration failed: ' + e.cause));

    // --- New call (incoming or outgoing) ---
    ua.on('newRTCSession', async ({ originator, session }) => {
      logger.log(session);
      order.value++;
      const id = session.id || 'sess_' + Date.now();


      function startCallTimer() {
        if (sessions.value[id].timer) return;

        sessions.value[id].timer = setInterval(() => {
          sessions.value[id].duration =
            Math.floor((Date.now() - sessions.value[id].startTime.getTime()) / 1000);
        }, 1000);
      }


      // DND:
      if (originator === 'remote' && dnd.value) {
      logger.log(`[DND] Rejecting incoming call from ${session.remote_identity.uri.user}`);
        cleanupCall("DND")
        session.terminate({
          status_code: 486, // Busy here
          reason_phrase: "Do Not Disturb"
        });
        return;
      }

      if(originator === 'remote' && !multiChannel.value) {
        if(Object.keys(sessions.value).length) {
          session.terminate({
            status_code: 486, // Busy here, no MultiChannel
            reason_phrase: "MultiChannel is off"
          });
          return;
        }
      }

      // Initialize session state
      sessions.value[id] = {
        id: session.id,
        passiveCall: false,
        order: order.value,
        direction: session.direction,
        timer: null,
        isAccepted: false,
        duration: 0,
        displayName:
          session.remote_identity?._display_name ||
          session.remote_identity?.uri?.user ||
          "Unknown",
        number: session.remote_identity?.uri?.user || null,
        raw: markRaw(session),
        startTime: new Date(),
        endTime: null,
        isMuted: false,
        isOnHold: false,
        contact: "waiting_for_the_value"
      };
      startCallTimer();

      logger.log(`New session from ${originator}: ${session.remote_identity.uri.toString()}`);

      if(sessions.value[id].number) {
        const contact = await contactsStore.findContactByPhone(sessions.value[id].number)
        let contactInfo = null
        if(contact !== null) {
          contactInfo = {
            contact_page_link: contact.contact_page_link,
            name: contact?.name ? contact.name : "",
          }
        }
        sessions.value[id].contact = contactInfo;
      }

      // --- Peer connection for audio ---
      function attachRemoteAudio() {
        const pc = session.connection;
        if (!pc) {
          logger.log("pc session connection error: ", pc);
          return
        }

        const audioEl = document.getElementById(`caller-voice-${session.id}`);
        if (!audioEl) {
          logger.log("No audio element found: ", audioEl);
          return;
        }

        pc.getReceivers().forEach((r) => {
          if (r.track && r.track.kind === 'audio') {
            const stream = new MediaStream([r.track]);
            audioEl.srcObject = stream;
            audioEl.play().catch(() => {});
          } else {
            logger.log("no track or track type is not audio");
          }
        });
      }

      // --- Incoming vs Outgoing audio ---
      if (originator === 'remote') {
        // Incoming call → play ringtone
        playAudio(ringtone, true);
      }

      // --- Call events ---
      session.on('progress', (e) => {
        logger.log(`Session ${id}: progress`);
      });
      
      session.on('accepted', (e) => {
        logger.log(`Session ${id}: accepted`);
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
        pauseAudio(ringtone);
      });
      
      session.on('confirmed', () => {
        logger.log(`Session ${id}: confirmed`);
        attachRemoteAudio();
        sessions.value[id].isAccepted = true;
      });

      // --- Call ended ---
      function cleanupCall(cause="Unknown") {
        logger.log(`[CALL END] id=${id} | cause=${cause}`);
        pauseAudio(ringtone);
        playAudio(callEndSound, false);

        if (sessions.value[id]?.timer) {
          clearInterval(sessions.value[id].timer);
        }
        delete sessions.value[id];
      }
      
      session.on('ended', (data) => {
        sessions.value[id].endTime = new Date();
        amoCallsStore.endedCallInfoPost(globals.system.amouser_id, sessions.value[id]);
        cleanupCall(data?.cause || 'ended')
      });
      session.on('failed', (data) => {
        sessions.value[id].endTime = new Date();
        amoCallsStore.endedCallInfoPost(globals.system.amouser_id, sessions.value[id]);
        cleanupCall(data?.cause || 'failed')
      });
      
      // --- Hold / Unhold ---
      session.on('hold', () => {
        sessions.value[id].isOnHold = true
        logger.log(`Session ${id}: local hold activated`)
      });
      session.on('unhold', () => {
        sessions.value[id].isOnHold = false
        logger.log(`Session ${id}: local hold removed`)
      });
      session.on('remotehold', () => {
        sessions.value[id].isOnHold = true
        logger.log(`Session ${id}: remote hold`)
      });
      session.on('remoteunhold', () => {
        sessions.value[id].isOnHold = false
        logger.log(`Session ${id}: remote unhold`)
      });

      session.on('*', (event, data) => {
        logger.log("EVENT:", event, data);
      });
      
      // --- Mute / Unmute ---
      session.on('muted', (data) => {
        sessions.value[id].isMuted = true
        logger.log(`[CALL ${id}] muted:`, data)
      });
      session.on('unmuted', (data) => {
        sessions.value[id].isMuted = false
        logger.log(`[CALL ${id}] unmuted:`, data)
      });
      
      // --- Call transfer ---
      session.on("referred", () => {
        logger.log(`[CALL ${session.id}] Transfer initiated`);
        delete sessions.value[id];
      });
      session.on("transferfailed", (data) => {
        logger.log(`[CALL ${session.id}] Transfer failed:`, data.cause);
      });
    });
  }


  // Stop User Agent
  function stopSip() {
    if (ua) ua.stop()
    logger.logger.log('JsSIP UA stopped.')
  }

  async function makeCall(targetNumber, domain) {
    const micCheck = await micControlStore.checkMicReal()
    if(!micCheck) {
      alert("Доступ к микрофону заблокирован браузером. Пожалуйста, разрешите доступ к микрофону, чтобы совершить звонок.");
      return;
    }

    if (!ua) {
      logger.warn("[CALL] UA not initialized.");
      return;
    }

    if (!targetNumber) {
      logger.warn("[CALL] No target number provided.");
      return;
    }


    const dialingSound = document.getElementById("utel-dialing-sound-effect")
    const callEndSound = document.getElementById("utel-end-call-sound-effect")

    const target = `sip:${targetNumber}@${domain}`;
    const eventHandlers = {
      progress: (e) => {
        logger.log(`[CALL] Call to ${target} is in progress...`);
        // Play dialing sound:
        playAudio(dialingSound, true); // loop
      },
      failed: (e) => {
        logger.log(`[CALL] Call to ${target} failed:`, e.cause);
        pauseAudio(dialingSound);
        playAudio(callEndSound);
      },
      ended: (e) => {
        logger.log(`[CALL] Call to ${target} ended:`, e.cause);
        pauseAudio(dialingSound);
        playAudio(callEndSound);
      },
      confirmed: (e) => {
        logger.log(`[CALL] Call to ${target} connected`);
        pauseAudio(dialingSound);
      }
    };

    const options = {
      eventHandlers,
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    };

    try {
      const session = ua.call(target, options);
      logger.log(`[CALL] Outgoing call initiated to ${target}`);
      if(Object.keys(sessions.value).length > 1) {
        Object.keys(sessions.value).forEach(sess => {
          if(sessions.value[sess].id != session.id) {
            sessions.value[sess].raw.hold()
          }
        })
      }
      // Storing the session will handle the newRTCSession event above, inside initialization
      
      return session;
    } catch (err) {
      logger.error("[CALL] Error initiating call:", err);
    }

    return null;
  }

  return {
    initSip,
    stopSip,
    sessions,
    liveCalls,
    dnd,
    setDND,
    multiChannel,
    setMultiChannel,
    makeCall,
    order
  }
})
