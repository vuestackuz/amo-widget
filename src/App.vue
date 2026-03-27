<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import ModalTriggerButton from './components/ModalTriggerButton.vue';
import Panel from './components/panel/index.vue';
import CallControlPanel from './components/panel/calls/CallControlPanel.vue';
import { useAmocrmStore } from './stores/amocrm.store';
import { useSipStore } from './stores/sip.store';
import { useSipWSStore } from './stores/sip-ws.store';
import { useGlobalsStore } from './stores/globals.store';
import { storeToRefs } from 'pinia';
import api from './api/axios';

const amocrmStore = useAmocrmStore();
const sipStore = useSipStore();
const sipWSStore = useSipWSStore();
const globalsStore = useGlobalsStore();
const { isModalOpen, isSettingsReady } = storeToRefs(globalsStore);

const toggleModal = () => {
  if (!isSettingsReady.value) {
    AMOCRM.notifications.show_message({
      header: 'Utel Widget',
      text: 'Не удалось загрузить настройки виджета: некорректный ответ',
      type: 'error',
    });
    return;
  }
  isModalOpen.value = !isModalOpen.value;
};

async function fetchSettings() {
  const amouser = window.__AMO_UTEL_WIDGET_SYSTEM__?.amouser;
  try {
    const { data } = await axios.get(`https://amocrm.utel.uz/api/lookup/${amouser}`, {
      headers: { 'User-Agent': 'utel-widget' },
    });
    if (!data?.domain || !data?.token) {
      AMOCRM.notifications.show_message({
        header: 'Utel Widget',
        text: 'Не удалось загрузить настройки виджета: некорректный ответ',
        type: 'error',
      });
      return false;
    }
    window.__AMO_UTEL_WIDGET_SETTINGS__ = { domain: data.domain, token: data.token };
    sessionStorage.setItem('utel-widget-domain', data.domain);
    sessionStorage.setItem('utel-widget-token', data.token);
    return true;
  } catch {
    AMOCRM.notifications.show_message({
      header: 'Utel Widget',
      text: 'Не удалось загрузить настройки виджета: некорректный ответ',
      type: 'error',
    });
    return false;
  }
}

async function onUnauthorized() {
  sessionStorage.removeItem('utel-widget-domain');
  sessionStorage.removeItem('utel-widget-token');
  isSettingsReady.value = false;
  await fetchSettings();
}

function onBeforeUnload(e) {
  if (!sipStore.liveCalls) return;
  sipStore.holdAllCalls();
  e.preventDefault();
}

onMounted(async () => {
  const cachedDomain = sessionStorage.getItem('utel-widget-domain');
  const cachedToken = sessionStorage.getItem('utel-widget-token');

  if (cachedDomain && cachedToken) {
    window.__AMO_UTEL_WIDGET_SETTINGS__ = { domain: cachedDomain, token: cachedToken };
    isSettingsReady.value = true;
  } else {
    const ok = await fetchSettings();
    if (!ok) return;
    isSettingsReady.value = true;
  }

  window.addEventListener('utel-widget:unauthorized', onUnauthorized, { once: true });

  try {
    const response = await api.get('/amocrm/widget/info');
    amocrmStore.amocrmInfo = response.result;
  } catch {
    return;
  }

  if (!sipStore.hasAttached) return;

  if (sipStore.hasCredential) {
    sipStore.initSip();
  } else {
    sipWSStore.init();
  }
  window.addEventListener('beforeunload', onBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
  window.removeEventListener('utel-widget:unauthorized', onUnauthorized);
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
