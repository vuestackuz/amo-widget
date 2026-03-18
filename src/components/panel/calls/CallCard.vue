<template>
  <div
    :id="props.session.id"
    class="call-card"
    :style="computedStyle"
    @mousedown="onMouseDown"
  >
    <CallCardPopout
      :show-dial="showDial"
      :session="props.session"
      :show-transfer="showTransfer"
      :dial-buttons-style="popoutStyle"
      :transfer-style="popoutStyle"
    />

    <div
      class="left-side-indicator"
      :class="{ active: props.session.isAccepted && !props.session.isOnHold && !props.session.isRemoteHold }"
    />

    <div class="caller-info">
      <div>
        <strong>
          <button
            v-if="props.session.contact !== null && props.session.contact !== 'waiting_for_the_value'"
            @click="contactsStore.openWidgetPage(props.session.contact.contact_page_link)"
          >{{ props.session.contact?.name ? helpersStore.abbreviatedContactName(props.session.contact.name) : "" }}</button>
          <span v-else>{{ props.session.displayName }}</span>
        </strong>
        <span>{{ props.session.number }}</span>
      </div>
    </div>

    <div class="call-footer">
      <div class="left">
        <div class="duration">{{ inHoursMinutesSeconds(props.session.talkDuration || props.session.duration) }}</div>
      </div>
      <div class="right">
        <button
          v-if="props.session.contact === null"
          class="add-contact-button"
          :style="{ bottom: props.session.passiveCall ? '26px' : '38px' }"
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

    <audio :id="`caller-voice-${props.session.id}`" autoplay playsinline />
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue';
import { useContactsStore } from '../../../stores/contacts.store';
import { useHelpersStore } from '../../../stores/helpers.store';
import { useContactLinking } from '../../../composables/useContactLinking';
import { useCallPopout } from '../../../composables/useCallPopout';
import { useDraggable } from '../../../composables/useDraggable';
import { inHoursMinutesSeconds } from '../../composables/dateTimeFormat';
import CallCardPopout from './CallCardPopout.vue';
import CallActions from './CallActions.vue';
import IconAddContact from '../../icons/IconAddContact.vue';

const props = defineProps(['session']);
const contactsStore = useContactsStore();
const helpersStore = useHelpersStore();
const { newContact, clearRetry } = useContactLinking();
const { showDial, showTransfer, showOrToggle } = useCallPopout();
const { computedStyle, onMouseDown } = useDraggable(props.session);

const popoutStyle = { right: '0', width: '100%' };

onBeforeUnmount(() => {
  clearRetry();
});
</script>


<style lang="scss" scoped>
.call-card {
  position: fixed;
  width: 260px;
  aspect-ratio: 3.2 / 1;
  background-color: black;
  display: grid;
  align-content: space-between;
  grid-template-columns: 100%;
  padding: 8px;
  padding-left: 14px;
  --border-radius: 4px;
  border-radius: var(--border-radius);
  * {
    font-family: Trebuchet MS, sans-serif;
    color: white;
    user-select: none;
  }
  &:has(.left-side-indicator.active) {
    z-index: 10300 !important;
  }

  .left-side-indicator {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 6px;
    border-radius: var(--border-radius);
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    background-color: hsl(45, 100%, 50%);
    &.active { background-color: var(--utel-green); }
  }

  .caller-info {
    & > div {
      display: flex;
      flex-direction: column;
      row-gap: 1px;
    }
    strong {
      font-size: 16px !important;
      button { color: var(--utel-blue); text-decoration: underline; }
    }
    span {
      font-size: 13px !important;
      opacity: 0.6;
    }
  }

  .call-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left .duration {
      font-size: 16px !important;
      opacity: 0.6;
    }

    .right {
      position: relative;
      display: flex;
      align-items: center;

      .add-contact-button {
        cursor: pointer;
        position: absolute;
        right: 0;
        bottom: 38px;
        width: 24px;
        height: 24px;
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        svg {
          height: 22px;
          color: var(--utel-green);
        }
      }
    }
  }
}
</style>
