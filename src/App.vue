<template>
  <UTeLButton />
  <ModalView />
  <CallsComponent />

</template>

<script setup>
import { onBeforeUnmount, onMounted, onUnmounted, watch } from "vue";
import { useGlobalsStore } from "../stores/globals";
import ModalView from "./components/ModalView.vue";
import UTeLButton from "./components/UTeLButton.vue";
import CallsComponent from "./components/CallsComponent.vue";
import { useUtelSipUserStore } from "../stores/utel-api/sipUser";
import { useSipStore } from "../stores/js-sip/sipStore";
import { useSipWSStore } from "../stores/utel-api/utel-sip-ws";
import logger from "./composables/logger";

const globals = useGlobalsStore()
const sipStore = useSipStore()
const sipUserStore = useUtelSipUserStore()
const sipWSStore = useSipWSStore()

// = Set Globals =

// Try initial read for globals
if (window.__AMO_UTEL_WIDGET_SETTINGS__) {
  globals.settings = window.__AMO_UTEL_WIDGET_SETTINGS__
}
if (window.__AMO_UTEL_WIDGET_SYSTEM__) {
  globals.system = window.__AMO_UTEL_WIDGET_SYSTEM__
}

// If they might appear later → poll or wait for event
const checkGlobals = () => {
  if (!globals.settings && window.__AMO_UTEL_WIDGET_SETTINGS__) {
    globals.settings = window.__AMO_UTEL_WIDGET_SETTINGS__
  }
  if (!globals.system && window.__AMO_UTEL_WIDGET_SYSTEM__) {
    globals.system = window.__AMO_UTEL_WIDGET_SYSTEM__
  }
}

const timer = setInterval(() => {
  checkGlobals()
  if (globals.system && globals.settings) {
    clearInterval(timer)
  }
}, 500)

onMounted(async () => {
  
  if(globals.hostname !== null && globals.settings?.token && globals.system?.amouser_id ) {
    await sipUserStore.getSipUserInfo(globals.system?.amouser_id, globals.hostname, globals.settings?.token)
    if(sipUserStore.notConnectedSipUser === 2 && [1,2].includes(sipUserStore.noOtherSoftPhoneConnection)) {
      logger.log("We got the Sip, initializing...");
      sipStore.initSip(sipUserStore.sipUser.credential.username, sipUserStore.sipUser.credential.password, globals.hostname)
    }
  }
  
  // Listen for the beforeunload event for calling the alert about the ongoing calls
  window.addEventListener('beforeunload', async (event) => {
  if (sipStore.liveCalls) {
      // put calls on hold
      Object.values(sipStore.sessions).forEach(s => s.raw.hold())

      // show confirmation
      event.preventDefault()
      event.returnValue = 'У вас есть текущие звонки!'
    }
  })

})

onBeforeUnmount(async () => {
  sipStore.stopSip()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style lang="scss">
#app {

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

  * {
    box-sizing: border-box;
    font-size: var(--utel-widget-font-size);
  }
}
</style>
