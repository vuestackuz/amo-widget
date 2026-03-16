<template>
    <div id="utel-calls-component">
      <transition-group name="new-call" appear>
        <CallCard
          v-for="(sess, id) in allCalls"
          :key="id"
          :session="sess"
          :style="{zIndex: 10000}"
        />
      </transition-group>
    </div>
  
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useSipStore } from '../../../stores/sip.store';
  import { useSipWSStore } from '../../../stores/sip-ws.store';
  import CallCard from './CallCard.vue'

  const sipStore = useSipStore()
  const sipWSStore = useSipWSStore()

  // Merge active sessions with passive calls; active sessions take priority on ID collision
  const allCalls = computed(() => {
    const result = { ...sipStore.sessions };
    for (const [id, call] of Object.entries(sipWSStore.passiveCalls)) {
      if (!result[id]) result[id] = call;
    }
    return result;
  });
  </script>
  
  <style lang="scss" scoped>
  #utel-calls-component {
    position: absolute;
    bottom: calc(100% + 12px);
    height: auto;
    min-height: 30px;
    max-height: calc(100vh - 240px);
    display: flex;
    flex-direction: column;
    row-gap: 5px;
    width: 100%;
    padding: 0 20px;
  }
  
  .new-call-enter-active,
  .new-call-leave-active {
    transition: all 0.25s ease;
  }
  
  .new-call-enter-from,
  .new-call-leave-to {
    transform: scale(0.94);
    opacity: 0;
  }
  </style>