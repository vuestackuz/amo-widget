<template>
  <div class="call-card"
    :id="'table-call-' + props.session.id"
  >

    <CallCardPopout :show-dial="showDial" :session="props.session" :show-transfer="showTransfer" :dial-buttons-style="dialButtonsStyle" :transfer-style="transferStyle" />

    <div class="main-section">
      <div class="left">
        <span class="left-side-indicator" :class="{active: props.session.isAccepted && !props.session.isOnHold}">
          <img v-if="props.session.direction === 'incoming'" :src="imgIncoming" alt="incoming call">
          <img v-else-if="props.session.direction === 'outgoing'" :src="imgOutgoing" alt="outgoing call">
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
        <span class="duration">
          {{ formattedDuration }}
        </span>
      </div>
      <div class="right">
        <button class="add-contact-button" v-if="props.session.contact === null" @click="newContact(props.session.number, props.session.id)">
          <img :src="imgAddContact" alt="add new contact">
        </button>
        <div class="call-actions" v-if="!props.session.passiveCall">
          <div class="conditional">
            <button class="accept-call-button" v-if="!props.session.isAccepted && props.session.direction === 'incoming'" @click="callActions.acceptCall(props.session.raw)">
              <img :src="imgAcceptCall" alt="accept call button">
            </button>
            <div class="active-call-actions" v-if="props.session.isAccepted">
              <button @click="showOrToggle('transfer')" :class="{active: showTransfer}">
                <img :src="imgTransferCall" alt="transfer call button">
              </button>
              <button @click="callActions.toggleMuteCall(props.session.raw)">
                <img v-if="!props.session.isMuted" :src="imgMicOn" alt="mute call button">
                <img v-else :src="imgMicOff" alt="unmute call button">
              </button>
              <button @click="showOrToggle('dial')" :class="{active: showDial}">
                <img :src="imgDial" alt="call dials button">
              </button>
              <button @click="callActions.toggleHold(props.session.raw)">
                <img v-if="props.session.isOnHold" :src="imgResume" alt="resume call button">
                <img v-else :src="imgHold" alt="hold call button">
              </button>
            </div>
          </div>
          <button class="reject-call-button" v-if="!props.session.passiveCall" @click="callActions.endCall(props.session.raw)">
            <img :src="imgRejectCall" alt="reject call button">
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useCallActionsStore } from '../../../stores/js-sip/callActions';
import { useGlobalsStore } from '../../../stores/globals';
import { widgetPath } from "../../utils/media_path";
import CallCardPopout from './CallCardPopout.vue';
import { useContactsStore } from '../../../stores/amo-api/contacts';
import { useSipStore } from '../../../stores/js-sip/sipStore';
import { useHelpersStore } from '../../../stores/helpers';

const callActions = useCallActionsStore();
const globals = useGlobalsStore();
const contactsStore = useContactsStore();
const sipStore = useSipStore();
const helpersStore = useHelpersStore()
const props = defineProps(["session"]);

const imgTransferToNumber = ref("icons/transfer-to-number.svg")
const imgAcceptCall = ref("icons/accept-call.svg")
const imgTransferCall = ref("icons/transfer-call.svg")
const imgMicOn = ref("icons/mic-on.svg")
const imgMicOff = ref("icons/mic-off.svg")
const imgDial = ref("icons/dial.svg")
const imgHold = ref("icons/hold.svg")
const imgResume = ref("icons/resume.svg")
const imgRejectCall = ref("icons/reject-call.svg")
const imgIncoming = ref("icons/incoming.svg")
const imgOutgoing = ref("icons/outgoing.svg")
const imgAddContact = ref("icons/add-contact.svg")

async function newContact(phone, id) {
  const response = (await contactsStore.createContactIfMissing(phone)).contact
  
  let attemptsLeft = 5
  const retry = async () => {
    if (!sipStore.sessions[id] || attemptsLeft <= 0) return
    attemptsLeft--
    const contact = await contactsStore.findContactByPhone(phone)
    if (contact !== null && contact.contact_page_link) {
      setContactInfo(id, contact)
      return
    }
    setTimeout(retry, 1000)
  }

  retry()
}

function setContactInfo(id, contact) {
  sipStore.sessions[id].contact = {
    contact_page_link: contact.contact_page_link,
    name: contact.name,
  }
}


// ----------------------
// Dial & Transfer popup
// ----------------------
const showDial = ref(false);
const showTransfer = ref(false);
const targetNumber = ref("")

const dialButtonsStyle = computed(() => ({
  right: '20px',
  width: '320px'
}));

const transferStyle = computed(() => ({
  right: '20px',
  width: '320px'
}));

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

function transferCall() {
  callActions.transferCall(props.session.raw, targetNumber.value, globals.mainDomain)
}

function closePopups() {
  showDial.value = false;
  showTransfer.value = false;
}

// ----------------------
// Timer formatting
// ----------------------
const formattedDuration = computed(() => {
  const m = Math.floor(props.session.duration / 60).toString().padStart(2, '0');
  const s = (props.session.duration % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

// ----------------------
// Lifecycle
// ----------------------
onMounted(() => {
  imgTransferToNumber.value = widgetPath(imgTransferToNumber.value)
  imgAcceptCall.value = widgetPath(imgAcceptCall.value)
  imgTransferCall.value = widgetPath(imgTransferCall.value)
  imgMicOn.value = widgetPath(imgMicOn.value)
  imgMicOff.value = widgetPath(imgMicOff.value)
  imgDial.value = widgetPath(imgDial.value)
  imgHold.value = widgetPath(imgHold.value)
  imgResume.value = widgetPath(imgResume.value)
  imgRejectCall.value = widgetPath(imgRejectCall.value)
  imgIncoming.value = widgetPath(imgIncoming.value)
  imgOutgoing.value = widgetPath(imgOutgoing.value)
  imgAddContact.value = widgetPath(imgAddContact.value)
});

onBeforeUnmount(() => {
  clearInterval(props.session.timer);
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
        &.active {
          background-color: var(--utel-green);
        }
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          height: 16px;
          //filter: invert(100%);
        }
      }
      strong {
        button {
          color: var(--utel-blue);
          text-decoration: underline;
        }
      }
      span {
        opacity: 0.6;
      }
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
        img {
          height: 18px;
          filter: var(--utel-widget-icon-filter-green);
        }
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
          img {
            height: 20px;
            filter: invert(100%) drop-shadow(0 0 2px rgba($color: #000, $alpha: 0.2));
          }
          &.accept-call-button, &.reject-call-button {
            width: 42px;
            height: 24px;
            border-radius: 4px;
          }
          &.accept-call-button {
            background-color: var(--utel-green);
          }
          &.reject-call-button {
            background-color: var(--utel-red);
          }
          &.active {
            filter: var(--utel-widget-icon-filter-blue);
          }
        }
        .conditional {
          display: flex;
          column-gap: var(--col-gap);
          .active-call-actions {
            margin-right: 4px;
            display: flex;
            column-gap: var(--col-gap);
            button {
              width: 22px;
              img {
                height: 16px;
              }
            }
          }
        }
      }
    }
  }
}
</style>