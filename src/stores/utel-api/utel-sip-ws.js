import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSipWSStore = defineStore('sipWS', () => {
  const passiveCalls = ref({});

  return { passiveCalls };
});
