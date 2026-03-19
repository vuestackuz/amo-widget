<template>
  <div
    class="call-card"
    :id="'table-call-' + props.session.id"
    :class="{
      'status--ringing': !props.session.isAccepted,
      'status--active': props.session.isAccepted && !props.session.isOnHold && !props.session.isRemoteHold,
      'status--hold': props.session.isAccepted && (props.session.isOnHold || props.session.isRemoteHold),
    }"
  >
    <CallCardPopout
      :show-dial="showDial"
      :session="props.session"
      :show-transfer="showTransfer"
      :dial-buttons-style="popoutStyle"
      :transfer-style="popoutStyle"
    />

    <div class="main-section">
      <div class="left">
        <span
          class="left-side-indicator"
          :class="{ active: props.session.isAccepted && !props.session.isOnHold && !props.session.isRemoteHold }"
        >
          <IconIncoming v-if="props.session.direction === 'incoming'" />
          <IconOutgoing v-else-if="props.session.direction === 'outgoing'" />
        </span>
        <strong>
          <button
            v-if="props.session.contact !== null && props.session.contact !== 'waiting_for_the_value'"
            @click="contactsStore.openWidgetPage(props.session.contact.contact_page_link)"
          >{{ props.session.contact?.name ? helpersStore.abbreviatedContactName(props.session.contact.name) : "" }}</button>
          <span v-else>{{ props.session.displayName }}</span>
        </strong>
        <span>{{ props.session.number }}</span>
        <span class="duration">{{ inHoursMinutesSeconds(props.session.duration) }}</span>
      </div>
      <div class="right">
        <button
          v-if="props.session.contact === null"
          class="add-contact-button"
          @click="newContact(props.session.number, props.session.id)"
        >
          <IconAddContact />
        </button>
        <CallActions
          :session="props.session"
          :show-dial="showDial"
          :show-transfer="showTransfer"
          @toggle="showOrToggle"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue';
import { useContactsStore } from '../../../stores/contacts.store';
import { useHelpersStore } from '../../../stores/helpers.store';
import { useContactLinking } from '../../../composables/useContactLinking';
import { useCallPopout } from '../../../composables/useCallPopout';
import { inHoursMinutesSeconds } from '../../composables/dateTimeFormat';
import CallCardPopout from './CallCardPopout.vue';
import CallActions from './CallActions.vue';
import IconAddContact from '../../icons/IconAddContact.vue';
import IconIncoming from '../../icons/IconIncoming.vue';
import IconOutgoing from '../../icons/IconOutgoing.vue';

const props = defineProps(['session']);
const contactsStore = useContactsStore();
const helpersStore = useHelpersStore();
const { newContact, clearRetry } = useContactLinking();
const { showDial, showTransfer, showOrToggle } = useCallPopout();

const popoutStyle = { right: '20px', width: '320px' };

onBeforeUnmount(() => {
  clearRetry();
});
</script>


<style lang="scss" scoped>
.call-card {
  position: relative;
  width: 100%;
  background-color: hsl(0, 0%, 8%);
  transition: background-color 0.3s ease;

  &.status--ringing  { background-color: hsl(45, 100%, 35%); }
  &.status--active   { background-color: hsl(158, 55%, 30%); }
  &.status--hold     { background-color: hsl(210, 70%, 35%); }
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
      align-items: center;
      column-gap: 6px;

      .add-contact-button {
        background-color: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        svg { height: 18px; color: var(--utel-green); }
      }
    }
  }
}
</style>
