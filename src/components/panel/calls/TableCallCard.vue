<template>
  <div class="call-card" :id="'table-call-' + props.session.id">
    <CallCardPopout :show-dial="showDial" :session="props.session" :show-transfer="showTransfer" :dial-buttons-style="dialButtonsStyle" :transfer-style="transferStyle" />

    <div class="main-section">
      <div class="left">
        <span class="left-side-indicator" :class="{active: props.session.isAccepted && !props.session.isOnHold && !props.session.isRemoteHold}">
          <IconIncoming v-if="props.session.direction === 'incoming'" />
          <IconOutgoing v-else-if="props.session.direction === 'outgoing'" />
        </span>
        <strong>
          <button
            v-if="props.session.contact !== null && props.session.contact !== 'waiting_for_the_value'"
            @click="contactsStore.openWidgetPage(props.session.contact.contact_page_link)"
            >{{ props.session.contact?.name ? helpersStore.abbreviatedContactName(props.session.contact.name) : "" }}</button
          >
          <span v-else>{{ props.session.displayName }}</span>
        </strong>
        <span>{{ props.session.number }}</span>
        <span class="duration">{{ formattedDuration }}</span>
      </div>
      <div class="right">
        <button class="add-contact-button" v-if="props.session.contact === null" @click="newContact(props.session.number, props.session.id)">
          <IconAddContact />
        </button>
        <div class="call-actions" v-if="!props.session.passiveCall">
          <div class="conditional">
            <button class="accept-call-button" v-if="!props.session.isAccepted && props.session.direction === 'incoming'" @click="callActions.acceptCall(props.session.raw)">
              <IconAcceptCall />
            </button>
            <div class="active-call-actions" v-if="props.session.isAccepted">
              <button @click="showOrToggle('transfer')" :class="{active: showTransfer}">
                <IconTransferCall />
              </button>
              <button @click="callActions.toggleMuteCall(props.session.raw)">
                <IconMicOn v-if="!props.session.isMuted" />
                <IconMicOff v-else />
              </button>
              <button @click="showOrToggle('dial')" :class="{active: showDial}">
                <IconDial />
              </button>
              <button @click="callActions.toggleHold(props.session.raw)">
                <IconResume v-if="props.session.isOnHold" />
                <IconHold v-else />
              </button>
            </div>
          </div>
          <button class="reject-call-button" v-if="!props.session.passiveCall" @click="callActions.endCall(props.session.raw)">
            <IconRejectCall />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { useCallActionsStore } from '../../../stores/call-actions.store';
import CallCardPopout from './CallCardPopout.vue';
import { useContactsStore } from '../../../stores/contacts.store';
import { useHelpersStore } from '../../../stores/helpers.store';
import { useContactLinking } from '../../../composables/useContactLinking';
import IconAcceptCall from '../../icons/IconAcceptCall.vue';
import IconRejectCall from '../../icons/IconRejectCall.vue';
import IconTransferCall from '../../icons/IconTransferCall.vue';
import IconMicOn from '../../icons/IconMicOn.vue';
import IconMicOff from '../../icons/IconMicOff.vue';
import IconDial from '../../icons/IconDial.vue';
import IconHold from '../../icons/IconHold.vue';
import IconResume from '../../icons/IconResume.vue';
import IconAddContact from '../../icons/IconAddContact.vue';
import IconIncoming from '../../icons/IconIncoming.vue';
import IconOutgoing from '../../icons/IconOutgoing.vue';

const callActions = useCallActionsStore();
const contactsStore = useContactsStore();
const helpersStore = useHelpersStore();
const props = defineProps(["session"]);
const { newContact, clearRetry } = useContactLinking();

// ----------------------
// Dial & Transfer popup
// ----------------------
const showDial = ref(false);
const showTransfer = ref(false);

const dialButtonsStyle = computed(() => ({ right: '20px', width: '320px' }));
const transferStyle = computed(() => ({ right: '20px', width: '320px' }));

function showOrToggle(popup) {
  if (popup === 'dial') {
    showTransfer.value = false;
    showDial.value = !showDial.value;
  }
  if (popup === 'transfer') {
    showDial.value = false;
    showTransfer.value = !showTransfer.value;
  }
}

// ----------------------
// Timer formatting
// ----------------------
const formattedDuration = computed(() => {
  const m = Math.floor(props.session.duration / 60).toString().padStart(2, '0');
  const s = (props.session.duration % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

onBeforeUnmount(() => {
  clearRetry();
});
</script>


<style lang="scss" scoped>
.call-card {
  width: 100%;
  background-color: black;
  --border-radius: 4px;
  border-radius: var(--border-radius);
  * {
    font-family: Trebuchet MS, sans-serif;
    color: white;
    user-select: none;
  }
  &:has(.left-side-indicator.active) {
    z-index: 10800 !important;
  }

  .main-section {
    display: grid;
    justify-content: space-between;
    align-items: center;
    grid-template-columns: 45% 45%;
    padding: 8px 16px;
    .left {
      display: flex;
      align-items: center;
      column-gap: 32px;
      .left-side-indicator {
        height: 24px;
        width: 26px;
        border-radius: var(--border-radius);
        background-color: hsl(45, 100%, 50%);
        &.active { background-color: var(--utel-green); }
        display: flex;
        align-items: center;
        justify-content: center;
        svg { height: 16px; }
      }
      strong button { color: var(--utel-blue); text-decoration: underline; }
      span { opacity: 0.6; }
    }
    .right {
      display: flex;
      justify-content: flex-end;
      column-gap: 6px;
      .add-contact-button {
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        svg { height: 18px; color: var(--utel-green); }
      }
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
          &.accept-call-button, &.reject-call-button {
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
    }
  }
}
</style>
