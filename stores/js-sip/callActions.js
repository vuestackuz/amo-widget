// src/stores/calls/useCallStore.js
import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'
import { useSipStore } from './sipStore'
import JsSIP from "jssip"
import { useMicControlStore } from '../micControl'
import logger from '../../src/composables/logger'

export const useCallActionsStore = defineStore('call', () => {

  const sipStore = useSipStore()
  const micControlStore = useMicControlStore()

  async function acceptCall(session) {
    const micCheck = await micControlStore.checkMicReal()
    if(!micCheck) {
      alert("Доступ к микрофону заблокирован браузером. Чтобы принять звонок во время процесса, разрешите доступ к микрофону и не обновляйте страницу.");
      return;
    }

    if(sipStore.multiChannel && Object.keys(sipStore.sessions).length > 1) {
      Object.keys(sipStore.sessions).forEach(sess => {
        if(sipStore.sessions[sess].id != session.id) {
          sipStore.sessions[sess].raw.hold()
        }
      })
    }

    session.answer({
      mediaConstraints: {
        audio: true,
        video: false
      }
    });
  }

  function endCall(session) {
    if (!session) {
      logger.warn(`No session found with ID: ${session.id}`);
      return;
    }

    // Only try to terminate if the session is not already ended
    if (session && (session.isEstablished || session.status !== JsSIP.RTCSession.C.STATUS_TERMINATED)) {
      try {
        session.terminate();
        logger.log(`Call with ID ${session.id} terminated.`);
      } catch (error) {
        logger.error(`Failed to terminate call: ${error}`);
      }
    }

    delete sipStore.sessions[session.id];
  }

  function toggleHold(session) {
    if (session.isOnHold().local) {
      session.unhold();
      if(Object.keys(sipStore.sessions).length > 1) {
        Object.keys(sipStore.sessions).forEach(sess => {
          if(sipStore.sessions[sess].id != session.id) {
            sipStore.sessions[sess].raw.hold()
          }
        })
      }
    } else {
      session.hold();
    }
  }

  function toggleMuteCall(session) {
    if (!session) return;

    // Get current mute status
    const muteStatus = session.isMuted(); // { audio: boolean, video: boolean }

    if (muteStatus.audio) {
      // If already muted → unmute
      session.unmute();
      logger.log(`[CALL] ${session._id} unmuted`);
    } else {
      // If not muted → mute
      session.mute();
      logger.log(`[CALL] ${session._id} muted`);
    }
  }

  const dials = [
    { name: "1", value: "1" },
    { name: "2", value: "2" },
    { name: "3", value: "3" },
    { name: "4", value: "4" },
    { name: "5", value: "5" },
    { name: "6", value: "6" },
    { name: "7", value: "7" },
    { name: "8", value: "8" },
    { name: "9", value: "9" },
    { name: "*", value: "*" },
    { name: "0", value: "0" },
    { name: "#", value: "#" }
  ];

  function sendDialTone(session, tone) {
    if (!session || !tone) return;

    try {
      session.sendDTMF(tone);  // tone can be "0"-"9", "*", "#"
      logger.log(`[CALL] ${session._id} sent DTMF: ${tone}`);
    } catch (e) {
      logger.error("Failed to send DTMF:", e);
    }

    // Play sound
    const sounds = [
      document.getElementById("utel-dtmf-sound-effect_low"),
      document.getElementById("utel-dtmf-sound-effect_mid"),
      document.getElementById("utel-dtmf-sound-effect_high"),
    ]
    if (sounds[dials.findIndex(dial => dial.value === tone) % 3]) {
      sounds[dials.findIndex(dial => dial.value === tone) % 3].currentTime = 0; // rewind to start
      sounds[dials.findIndex(dial => dial.value === tone) % 3].play().catch(err => logger.warn("Audio play failed", err));
    }
  }

  function transferCall(session, targetNumber, domain) {
    if (!session) {
      logger.warn("[TRANSFER] No active session.");
      return;
    }

    if (!targetNumber) {
      logger.warn("[TRANSFER] No target number provided.");
      return;
    }

    const target = `sip:${targetNumber}@${domain}`;

    try {
      session.refer(target);
      logger.log(`[TRANSFER] Call transferred to ${target}`);
      
      // In case if UTeL won't send us the 202 Accepted, we just wait a while and terminate the transferred call
      setTimeout(() => {
        session.terminate();
        logger.log("[TRANSFER] Local call leg ended.");
      }, 500);
    } catch (err) {
      logger.error("[TRANSFER ERROR]", err);
    }
  }



  return {
    acceptCall,
    endCall,
    toggleHold,
    toggleMuteCall,
    dials,
    sendDialTone,
    transferCall
  }
})
