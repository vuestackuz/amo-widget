function detectAudioBaseUrl() {
  if (window.__AMO_UTEL_WIDGET_SETTINGS__?.audioBaseUrl) {
    return window.__AMO_UTEL_WIDGET_SETTINGS__.audioBaseUrl;
  }

  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return '/audio';
  }

  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    if (script.src && script.src.includes('app.js')) {
      return script.src.replace(/\/app\.js(\?.*)?$/, '/audio');
    }
  }

  return 'https://utel.uz/for-utel-widget/audio';
}

let audio = null;

// Resolves on first user interaction — required by browser autoplay policy
const userInteracted = new Promise((resolve) => {
  const handler = () => {
    resolve();
    document.removeEventListener('click', handler, true);
    document.removeEventListener('touchstart', handler, true);
    document.removeEventListener('keydown', handler, true);
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('touchstart', handler, true);
  document.addEventListener('keydown', handler, true);
});

function getAudio() {
  if (!audio) {
    const BASE_URL = detectAudioBaseUrl();
    audio = {
      ringtone: new Audio(`${BASE_URL}/ringtone.mp3`),
      dialing: new Audio(`${BASE_URL}/dialing.mp3`),
      endCall: new Audio(`${BASE_URL}/end-call.mp3`),
      dtmfLow: new Audio(`${BASE_URL}/DTMF-low.mp3`),
      dtmfMid: new Audio(`${BASE_URL}/DTMF-mid.mp3`),
      dtmfHigh: new Audio(`${BASE_URL}/DTMF-high.mp3`),
      connected: new Audio(`${BASE_URL}/connected.mp3`),
      disconnected: new Audio(`${BASE_URL}/disconnected.mp3`),
    };
  }
  return audio;
}

function play(audioEl, loop = false) {
  if (!audioEl) return;
  userInteracted.then(() => {
    audioEl.currentTime = 0;
    audioEl.loop = loop;
    audioEl.play().catch((err) => console.warn('[Audio] Play failed:', err));
  });
}

function pause(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

export function useAudio() {
  return { audio: getAudio(), play, pause };
}
