import { defineStore } from 'pinia'
import logger from '../src/composables/logger';

export const useMicControlStore = defineStore('mic-control', () => {

  // Soft check:
  async function checkMic() {
    const status = await navigator.permissions.query({ name: 'microphone' });

    if (status.state === 'granted') {
      return true;
    }

    return false;
  }

  async function requestMic() {
    try {
      logger.log('[mic] requesting access...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      logger.log('[mic] ✅ user ALLOWED microphone');

      // stop immediately
      stream.getTracks().forEach(t => t.stop());

      return true;
    } catch (e) {
      logger.log('[mic] ❌ microphone NOT allowed');
      logger.log('[mic] error name:', e.name);
      logger.log('[mic] error message:', e.message);

      if (e.name === 'NotAllowedError') {
        logger.log('[mic] reason: permission denied by user / browser');
      } else if (e.name === 'NotFoundError') {
        logger.log('[mic] reason: no microphone device found');
      } else if (e.name === 'NotReadableError') {
        logger.log('[mic] reason: microphone is busy');
      }

      return false;
    }
  }

  async function checkMicReal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        logger.log("user blocked mic");
      } else if (e.name === 'NotFoundError') {
        logger.log("no mic device or other error: ", e);
      }
      logger.log("Trying to get mic permission...");
      const permissionResult = await requestMic()
      return permissionResult;
    }
  }

  return {
    checkMic,
    requestMic,
    checkMicReal
  }
})