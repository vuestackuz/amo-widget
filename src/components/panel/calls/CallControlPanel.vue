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
  
    <!-- Sound Effect by <a href="https://pixabay.com/users/universfield-28281460/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=376904">Universfield</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=376904">Pixabay</a> -->
    <audio id="utel-ringtone" src="https://utel.uz/for-utel-widget/audio/ringtone.mp3" preload="auto"></audio>
    
    <audio id="utel-dialing-sound-effect" src="https://utel.uz/for-utel-widget/audio/dialing.mp3" preload="auto"></audio>
  
    <!-- Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=7025">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=7025">Pixabay</a> -->
    <audio id="utel-dtmf-sound-effect_low" src="https://utel.uz/for-utel-widget/audio/DTMF-low.mp3"></audio>
    <audio id="utel-dtmf-sound-effect_mid" src="https://utel.uz/for-utel-widget/audio/DTMF-mid.mp3"></audio>
    <audio id="utel-dtmf-sound-effect_high" src="https://utel.uz/for-utel-widget/audio/DTMF-high.mp3"></audio>
  
    <!-- Sound Effect by <a href="https://pixabay.com/users/u_z31mph1yzr-30039984/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=120633">u_z31mph1yzr</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=120633">Pixabay</a> -->
    <audio id="utel-end-call-sound-effect" src="https://utel.uz/for-utel-widget/audio/end-call.mp3" preload="auto"></audio>
  
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