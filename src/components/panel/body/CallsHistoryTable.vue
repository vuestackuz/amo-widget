<template>
  <div id="utel-calls-history-table">
    <div class="calls-table-header">
      <span>Звонок</span>
      <span>Дата и время</span>
      <span>Контакт</span>
      <span>Номер</span>
      <span>Длительность</span>
      <span>Статус</span>
    </div>
    <div class="calls-table-body">
      <div v-if="!calls.length" class="calls-empty">
        <span>Нет звонков</span>
      </div>
      <transition-group v-else tag="div" class="calls" name="calls-table-rows" appear>
        <div
          class="raw"
          v-for="(call, index) in calls"
          :key="call.id"
          :class="{
            missed: call.call_status[0] !== 4,
            incoming: call.direction === 'incoming',
            outgoing: call.direction === 'outgoing',
            internal: call.number <= 5,
          }"
          :style="{'--from-top': `calc(40px * ${index})`}"
        >
          <span>
            <div class="status-bar"></div>
            <IconCallArrowIn v-if="call.direction === 'incoming'" />
            <IconCallArrowOut v-else-if="call.direction === 'outgoing'" />
            <IconCallArrowInternal v-else-if="call.number <= 5" />
          </span>
          <span>
            <span v-if="call.call_status[0] === 4 && call.startTime">{{ formatIsoToReadable(call.startTime) }}</span>
            <span v-else-if="call.endTime">{{ formatIsoToReadable(call.endTime) }}</span>
          </span>
          <span>
            <button
              v-if="call.contact !== null && call.contact?.contact_page_link"
              @click="contactsStore.openWidgetPage(call.contact.contact_page_link)"
              >{{ call.contact?.name ? helpersStore.abbreviatedContactName(call.contact.name) : "" }}</button
            >
            <button v-else @click="newContact(call.number, call.id)">
              Создать контакт
            </button>
          </span>
          <span>
            <button v-if="SipUserStore.sipUser" @click="CallTo(call.number)">
              <IconNumberCall v-if="call.number.length" />
              <span>{{ call.number }}</span>
            </button>
            <div class="without-the-call-action" v-else>
              <span>{{ call.number }}</span>
            </div>
          </span>
          <span>{{ inHoursMinutesSeconds(call.duration) }}</span>
          <span>{{ call.call_status[1] }}</span>
        </div>
      </transition-group>
    </div>
  </div>
</template>


<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { inHoursMinutesSeconds } from "../../composables/dateTimeFormat";
import { useContactsStore } from "../../../stores/contacts.store";
import { useHelpersStore } from "../../../stores/helpers.store";
import { useSipStore } from "../../../stores/sip.store";
import { useUtelSipUserStore } from "../../../stores/sip-user.store";
import { useAmoCallsStore } from "../../../stores/amo-calls.store";
import logger from "../../composables/logger";
import IconCallArrowIn from "../../icons/IconCallArrowIn.vue";
import IconCallArrowOut from "../../icons/IconCallArrowOut.vue";
import IconCallArrowInternal from "../../icons/IconCallArrowInternal.vue";
import IconNumberCall from "../../icons/IconNumberCall.vue";

defineProps(['calls']);

const contactsStore = useContactsStore();
const helpersStore = useHelpersStore();
const sipStore = useSipStore();
const SipUserStore = useUtelSipUserStore();
const amoCallsStore = useAmoCallsStore();

function formatIsoToReadable(isoString) {
  const date = new Date(isoString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

let retryTimeout = null;

async function newContact(phone, id) {
  await contactsStore.createContactIfMissing(phone);

  let attemptsLeft = 5;
  const retry = async () => {
    const call = amoCallsStore.calls.find(c => c.id === id);
    if (!call || attemptsLeft <= 0) return;
    attemptsLeft--;
    const contact = await contactsStore.findContactByPhone(phone);
    if (contact !== null && contact.contact_page_link) {
      setContactInfo(id, contact);
      return;
    }
    retryTimeout = setTimeout(retry, 1000);
  };

  retry();
}

function setContactInfo(id, contact) {
  const theCall = amoCallsStore.calls.find(call => call.id === id);
  if (theCall) {
    theCall.contact = {
      contact_page_link: contact.contact_page_link,
      name: contact.name,
    };
  }
}

function CallTo(number) {
  if (!number) {
    logger.warn('CallTo: no number provided');
    return;
  }
  sipStore.makeCall(number);
}

onMounted(() => {
  amoCallsStore.fetchCalls();
  amoCallsStore.reAddContactInfo();
});

onBeforeUnmount(() => {
  clearTimeout(retryTimeout);
});
</script>

<style lang="scss" scoped>
#utel-calls-history-table {
  width: 100%;
  border-spacing: 0;
  overflow-x: auto;

  .calls-table-header,
  .calls-table-body .calls div.raw {
    display: grid;
    grid-template-columns: 80px repeat(5, 1fr);
    align-items: center;
    padding: 0 20px;
    height: 40px;
    & > span {
      a,
      button {
        cursor: pointer;
        &:hover {
          color: var(--utel-blue);
          span { color: var(--utel-blue); }
          text-decoration: underline;
        }
      }
      button {
        background-color: transparent;
        border: none;
        outline: none;
        position: relative;
        color: var(--utel-widget-text-color);
        svg {
          position: absolute;
          height: 20px;
          right: calc(100% + 2px);
          top: 50%;
          transform: translateY(-50%);
          color: var(--utel-blue);
          opacity: 0;
          transition: opacity 0.125s ease;
        }
        &:hover svg { opacity: 1; }
      }

      .without-the-call-action {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:nth-child(2) { min-width: 180px; }
      &:nth-child(3) { text-align: center; min-width: 28ch; }
      &:nth-child(4) { text-align: center; min-width: 140px; }
      &:nth-child(5) { text-align: center; min-width: 160px; }
      &:nth-child(6) { text-align: left; min-width: 160px; }
    }
  }

  .calls-table-header {
    width: auto !important;
    height: 46px;
    background: var(--utel-widget-bg-012);
    font-weight: 600;
    align-items: center;
    box-shadow: 0 4px 10px rgba($color: #000000, $alpha: 0.1);
    min-width: 1200px;
  }

  .calls-table-body {
    width: auto !important;
    height: calc(100vh - 66px - 42px - 46px - 66px);
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 1200px;

    position: relative;
    .calls-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.4;
      font-size: var(--utel-widget-font-size);
    }
    .calls {
      position: relative;
      div.raw {
        width: 100%;
        top: var(--from-top);
        &:nth-child(even) { background-color: var(--utel-widget-bg-011); }
        span {
          height: 20px;
          &:first-child {
            display: flex;
            align-items: center;
            .status-bar {
              height: 40px;
              width: 4px;
              margin-right: 8px;
              background-color: white;
              opacity: 0.5;
            }
            svg { height: 20px; }
          }
        }
        &.incoming span:first-child svg { color: var(--utel-green); }
        &.outgoing span:first-child svg { color: var(--utel-blue); }
        &.missed {
          span:first-child .status-bar { background-color: var(--utel-red); }
          span:first-child svg { color: var(--utel-red); }
        }
      }
    }
  }
}

.calls-table-rows-move,
.calls-table-rows-enter-active,
.calls-table-rows-leave-active {
  transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.calls-table-rows-enter-from {
  opacity: 0;
  transform: translate(0, 30px);
}
.calls-table-rows-leave-to { opacity: 0; }

.calls-table-rows-leave-active { position: absolute; }
</style>
