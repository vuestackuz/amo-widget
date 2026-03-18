<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import ModalTriggerButton from './components/ModalTriggerButton.vue';
import Panel from './components/panel/index.vue';
import CallControlPanel from './components/panel/calls/CallControlPanel.vue';
import { useAmocrmStore } from './stores/amocrm.store';
import { useSipStore } from './stores/sip.store';
import { useSipWSStore } from './stores/sip-ws.store';
import { storeToRefs } from 'pinia';

const amocrmStore = useAmocrmStore();
const sipStore = useSipStore();
const sipWSStore = useSipWSStore();
const { isError } = storeToRefs(amocrmStore);
const isModalOpen = ref(false);

const toggleModal = () => {
  isModalOpen.value = !isModalOpen.value;
};

function onBeforeUnload(e) {
  if (!sipStore.liveCalls) return;
  sipStore.holdAllCalls();
  e.preventDefault();
}

onMounted(async () => {
  await amocrmStore.fetchAmocrmInfo();
  if (!sipStore.hasAttached) {
    return
  }
  if (sipStore.hasCredential) {
    sipStore.initSip();
  } else {
    sipWSStore.init();
  } 
  window.addEventListener('beforeunload', onBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>
<template>
  <ModalTriggerButton @open="toggleModal" />
  <Panel
    v-if="isModalOpen"
    @close="toggleModal"
  />
  <CallControlPanel v-if="sipStore.hasAttached" />
</template>


<style lang="scss">
body {
  font-size: var(--utel-widget-font-size);
  font-family: "Segoe UI", sans-serif;
}
*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#utel-widget-app {

  // Font:
  --utel-widget-font-size: 16px;

  // Theme colors:
  --utel-widget-bg-01: hsl(205, 52%, 17%);
  --utel-widget-bg-011: hsla(0, 0%, 100%, 0.05);
  --utel-widget-bg-012: hsla(0, 0%, 100%, 0.1);
  --utel-widget-bg-02: hsl(206, 53%, 13%);
  --utel-widget-bg-03: hsl(207, 61%, 7%);
  --utel-widget-theme-color: hsla(205, 100%, 47%, 1);
  --utel-widget-text-color: hsl(0, 0%, 100%);
  --utel-widget-text-secondary: hsla(0, 0%, 100%, 0.8);
  --utel-widget-border-color: hsl(200, 5%, 57%);

  --utel-red: #f73463;
  --utel-green: #43d1a7;
  --utel-blue: #008bf1;

  // Icon recoloring filters:
  --utel-widget-icon-filter: invert(100%);
  --utel-widget-icon-filter-green: invert(65%) sepia(91%) saturate(291%) hue-rotate(111deg) brightness(92%)
    contrast(88%);
  --utel-widget-icon-filter-orange: invert(65%) sepia(25%) saturate(5358%) hue-rotate(339deg) brightness(104%) contrast(101%);  ;
  --utel-widget-icon-filter-blue: invert(45%) sepia(42%) saturate(6863%) hue-rotate(185deg) brightness(99%)
    contrast(101%);
  --utel-widget-icon-filter-red: invert(29%) sepia(44%) saturate(3526%) hue-rotate(325deg) brightness(101%)
    contrast(94%);
}
</style>
