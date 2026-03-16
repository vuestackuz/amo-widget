import { defineStore } from 'pinia';
import { useAudio } from '../composables/useAudio';
import { useGlobalsStore } from './globals.store';

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
    try {
      rawSession.answer({ mediaConstraints: { audio: true, video: false } });
    } catch (err) {
      console.error('[SIP] acceptCall failed:', err);
    }
  }

  function endCall(rawSession) {
    try {
      rawSession.terminate();
    } catch (err) {
      console.error('[SIP] endCall failed:', err);
    }
  }

  function toggleMuteCall(rawSession) {
    try {
      if (rawSession.isMuted().audio) {
        rawSession.unmute({ audio: true });
      } else {
        rawSession.mute({ audio: true });
      }
    } catch (err) {
      console.error('[SIP] toggleMuteCall failed:', err);
    }
  }

  function toggleHold(rawSession) {
    try {
      if (rawSession.isOnHold().local) {
        rawSession.unhold();
      } else {
        rawSession.hold();
      }
    } catch (err) {
      console.error('[SIP] toggleHold failed:', err);
    }
  }

  function transferCall(rawSession, number) {
    try {
      const domain = useGlobalsStore().mainDomain;
      rawSession.refer(`sip:${number}@${domain}`);
    } catch (err) {
      console.error('[SIP] transferCall failed:', err);
    }
  }

  function sendDialTone(rawSession, value) {
    try {
      rawSession.sendDTMF(value);
      play(dtmfTone(value, audio));
    } catch (err) {
      console.error('[SIP] sendDialTone failed:', err);
    }
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
