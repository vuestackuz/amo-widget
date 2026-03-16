import { defineStore } from 'pinia';
import { useAudio } from '../../composables/useAudio';

const dials = [
  { name: '1', value: '1' }, { name: '2', value: '2' }, { name: '3', value: '3' },
  { name: '4', value: '4' }, { name: '5', value: '5' }, { name: '6', value: '6' },
  { name: '7', value: '7' }, { name: '8', value: '8' }, { name: '9', value: '9' },
  { name: '*', value: '*' }, { name: '0', value: '0' }, { name: '#', value: '#' },
];

// Maps dial value to DTMF tone group: 1-3 → high, 4-6 → mid, everything else → low
function dtmfTone(value, audio) {
  if (['1', '2', '3'].includes(value)) return audio.dtmfHigh;
  if (['4', '5', '6'].includes(value)) return audio.dtmfMid;
  return audio.dtmfLow;
}

export const useCallActionsStore = defineStore('callActions', () => {
  const { audio, play } = useAudio();
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
    play(dtmfTone(value, audio));
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
