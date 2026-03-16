import { defineStore } from 'pinia';

const dials = [
  { name: '1', value: '1' }, { name: '2', value: '2' }, { name: '3', value: '3' },
  { name: '4', value: '4' }, { name: '5', value: '5' }, { name: '6', value: '6' },
  { name: '7', value: '7' }, { name: '8', value: '8' }, { name: '9', value: '9' },
  { name: '*', value: '*' }, { name: '0', value: '0' }, { name: '#', value: '#' },
];

export const useCallActionsStore = defineStore('callActions', () => {
  function acceptCall(rawSession) {
    rawSession.answer({ mediaConstraints: { audio: true, video: false } });
  }

  function endCall(rawSession) {
    rawSession.terminate();
  }

  function toggleMuteCall(rawSession) {
    if (rawSession.isMuted().audio) {
      rawSession.unmute({ audio: true });
    } else {
      rawSession.mute({ audio: true });
    }
  }

  function toggleHold(rawSession) {
    if (rawSession.isOnHold().local) {
      rawSession.unhold();
    } else {
      rawSession.hold();
    }
  }

  function transferCall(rawSession, number, domain) {
    rawSession.refer(`sip:${number}@${domain}`);
  }

  function sendDialTone(rawSession, value) {
    rawSession.sendDTMF(value);
  }

  return {
    dials,
    acceptCall,
    endCall,
    toggleMuteCall,
    toggleHold,
    transferCall,
    sendDialTone,
  };
});
