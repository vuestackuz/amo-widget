const BASE_URL = 'https://utel.uz/for-utel-widget/audio';

const audio = {
  ringtone: new Audio(`${BASE_URL}/ringtone.mp3`),
  dialing: new Audio(`${BASE_URL}/dialing.mp3`),
  endCall: new Audio(`${BASE_URL}/end-call.mp3`),
};

function play(audioEl, loop = false) {
  if (!audioEl) return;
  audioEl.currentTime = 0;
  audioEl.loop = loop;
  audioEl.play().catch((err) => console.warn('[Audio] Play failed:', err));
}

function pause(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

export function useAudio() {
  return { audio, play, pause };
}
