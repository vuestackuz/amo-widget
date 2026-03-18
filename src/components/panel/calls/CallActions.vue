<template>
  <div v-if="!session.passiveCall" class="call-actions">
    <div class="conditional">
      <button
        v-if="!session.isAccepted && session.direction === 'incoming'"
        class="accept-call-button"
        @click="callActions.acceptCall(session.raw)"
      >
        <IconAcceptCall />
      </button>
      <div v-if="session.isAccepted" class="active-call-actions">
        <button :class="{ active: showTransfer }" @click="$emit('toggle', 'transfer')">
          <IconTransferCall />
        </button>
        <button @click="callActions.toggleMuteCall(session.raw)">
          <IconMicOn v-if="!session.isMuted" />
          <IconMicOff v-else />
        </button>
        <button :class="{ active: showDial }" @click="$emit('toggle', 'dial')">
          <IconDial />
        </button>
        <button @click="callActions.toggleHold(session.raw)">
          <IconResume v-if="session.isOnHold" />
          <IconHold v-else />
        </button>
      </div>
    </div>
    <button class="reject-call-button" @click="callActions.endCall(session.raw)">
      <IconRejectCall />
    </button>
  </div>
</template>

<script setup>
import { useCallActionsStore } from '../../../stores/call-actions.store';
import IconAcceptCall from '../../icons/IconAcceptCall.vue';
import IconRejectCall from '../../icons/IconRejectCall.vue';
import IconTransferCall from '../../icons/IconTransferCall.vue';
import IconMicOn from '../../icons/IconMicOn.vue';
import IconMicOff from '../../icons/IconMicOff.vue';
import IconDial from '../../icons/IconDial.vue';
import IconHold from '../../icons/IconHold.vue';
import IconResume from '../../icons/IconResume.vue';

defineProps(['session', 'showDial', 'showTransfer']);
defineEmits(['toggle']);

const callActions = useCallActionsStore();
</script>

<style lang="scss" scoped>
.call-actions {
  display: flex;
  --col-gap: 4px;
  column-gap: var(--col-gap);

  button {
    cursor: pointer;
    padding: 0;
    background-color: transparent;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      height: 20px;
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
    }
    &.accept-call-button,
    &.reject-call-button {
      width: 42px;
      height: 24px;
      border-radius: 4px;
    }
    &.accept-call-button { background-color: var(--utel-green); }
    &.reject-call-button { background-color: var(--utel-red); }
    &.active svg { color: var(--utel-blue); }
  }

  .conditional {
    display: flex;
    column-gap: var(--col-gap);
    .active-call-actions {
      margin-right: 4px;
      display: flex;
      column-gap: var(--col-gap);
      button { width: 22px; svg { height: 16px; } }
    }
  }
}
</style>
