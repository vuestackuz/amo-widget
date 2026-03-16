<script setup>
import CallInput from './CallInput.vue';
import SipControlButton from './SipControlButton.vue';
import CallControlPanel from '../calls/CallControlPanel.vue';

const widgetVersion = window.__AMO_UTEL_WIDGET_SETTINGS__.version;
</script>

<template>
    <div class="utel-widget-modal__footer">
        <CallInput />
        <SipControlButton title="DND" label="Не беспокоить" />
        <SipControlButton title="Multichannel" label="Многоканальность" />
        <span class="utel-widget-modal__footer--version">v{{ widgetVersion }}</span>
    </div>
    <CallControlPanel />
</template>

<style lang="scss" scoped>
.utel-widget-modal__footer {
  padding: 16px 32px;
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 24px;
  border-top: 1px solid var(--utel-widget-border-color);
  background: var(--utel-widget-bg-03);

  &--version {
    margin-left: auto;
    color: var(--utel-widget-text-color);
    font-weight: 400;
  }
}
</style>
