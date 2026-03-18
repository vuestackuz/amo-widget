<script setup>
import CallInput from './CallInput.vue';
import SipControlButton from './SipControlButton.vue';
import TableCallControlPanel from '../calls/TableCallControlPanel.vue';
import { useSipStore } from '../../../stores/sip.store';

const sipStore = useSipStore();
const widgetVersion = window.__AMO_UTEL_WIDGET_SETTINGS__?.version;
</script>

<template>
  <TableCallControlPanel />
  <div class="utel-widget-modal__footer">
    <span
      v-if="!sipStore.hasCredential"
      class="utel-widget-modal__footer--no-credential"
    >Учётные данные SIP не настроены</span>
    <template v-else>
      <CallInput />
      <SipControlButton
        title="Не беспокоить — отклонять входящие звонки"
        label="Не беспокоить"
        :model-value="sipStore.dnd"
        @update:model-value="sipStore.setDND"
      />
      <SipControlButton
        title="Многоканальность — принимать несколько звонков одновременно"
        label="Многоканальность"
        :model-value="sipStore.multiChannel"
        @update:model-value="sipStore.setMultiChannel"
      />
    </template>
    <span class="utel-widget-modal__footer--version">v{{ widgetVersion }}</span>
  </div>
</template>

<style lang="scss" scoped>
.utel-widget-modal__footer {
  position: relative;
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

  &--no-credential {
    color: var(--utel-widget-text-secondary);
    font-size: calc(0.9 * var(--utel-widget-font-size));
    opacity: 0.6;
  }
}
</style>
