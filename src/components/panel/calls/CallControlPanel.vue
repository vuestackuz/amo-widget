<template>
    <div id="utel-calls-component">
      <transition-group name="new-call" appear>
        <CallCard
          v-for="(sess, id) in {...sipStore.sessions, ...sipWSStore.passiveCalls}"
          :key="id"
          :session="sess"
          :style="{zIndex: 10000}"
        />
      </transition-group>
    </div>
  
  </template>
  
  <script setup>
  import { useSipStore } from '../../../stores/js-sip/sipStore';
  import { useSipWSStore } from '../../../stores/utel-api/utel-sip-ws';
  import CallCard from './CallCard.vue'
  
  const sipStore = useSipStore()
  const sipWSStore = useSipWSStore()
  </script>
  
  <style lang="scss" scoped>
  #utel-calls-component {
  
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