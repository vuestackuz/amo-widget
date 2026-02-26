<template>
  <!-- <pre>
    {{ Object.keys(sipStore.sessions).map(item => item.contact) }}
  </pre> -->
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
      <transition-group tag="div" class="calls" name="calls-table-rows" appear>
        <div
          class="raw"
          v-for="(call, index) in amoCallsStore.formattedCalls"
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
            <img v-if="call.direction === 'incoming'" :src="imgCallArrowIn" />
            <img
              v-else-if="call.direction === 'outgoing'"
              :src="imgCallArrowOut"
            />
            <img
              v-else-if="call.number <= 5"
              :src="imgCallArrowInternal"
            />
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
              <img v-if="call.number.length" :src="imgNumberCall" alt="call" />
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
import { computed, onMounted, ref } from "vue";
import { inHoursMinutesSeconds } from "../../composables/dateTimeFormat";
import { widgetPath } from "../../utils/media_path";
import { useContactsStore } from "../../../stores/amo-api/contacts";
import { useHelpersStore } from "../../../stores/helpers";
import { useSipStore } from "../../../stores/js-sip/sipStore";
import { useGlobalsStore } from "../../../stores/globals";
import { useUtelSipUserStore } from "../../../stores/utel-api/sipUser";
import { useAmoCallsStore } from "../../../stores/amo-api/amo-calls";
import logger from "../../composables/logger";

const imgCallArrowIn = ref("icons/call_arrow_in.svg");
const imgCallArrowOut = ref("icons/call_arrow_out.svg");
const imgCallArrowInternal = ref("icons/call_arrow_internal.svg");
const imgNumberCall = ref("icons/number-call.svg");

const contactsStore = useContactsStore();
const helpersStore = useHelpersStore();
const sipStore = useSipStore();
const globals = useGlobalsStore();
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

async function newContact(phone, id) {
  helpersStore.closeModal();
  
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
  const theCall = amoCallsStore.calls.find(call => call.id === id)
  if(theCall) {
    theCall.contact = {
      contact_page_link: contact.contact_page_link,
      name: contact.name,
    }
  }
}

function CallTo(number) {
  if (globals.mainDomain) {
    if ([1,2].includes(SipUserStore.noOtherSoftPhoneConnection)) {
      sipStore.makeCall(number, globals.mainDomain);
    } else if (
      globals.hostname !== null &&
      globals.settings?.token &&
      globals.system?.amouser_id
    ) {
      SipUserStore.originateTo(
        globals.system?.amouser_id,
        globals.hostname,
        globals.settings?.token,
        number
      );
    } else {
      logger.error(
        "Could not make a call or originate. Check globals and sip registration"
      );
    }
  } else {
    logger.error("Main domain is not to be found");
  }
}

onMounted(async () => {
  imgCallArrowIn.value = widgetPath(imgCallArrowIn.value);
  imgCallArrowOut.value = widgetPath(imgCallArrowOut.value);
  imgCallArrowInternal.value = widgetPath(imgCallArrowInternal.value);
  imgNumberCall.value = widgetPath(imgNumberCall.value);

  amoCallsStore.reAddContactInfo()
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
          span {
            color: var(--utel-blue);
          }
          text-decoration: underline;
        }
      }
      button {
        background-color: transparent;
        border: none;
        outline: none;
        position: relative;
        img {
          position: absolute;
          height: 20px;
          right: calc(100% + 2px);
          top: 50%;
          transform: translateY(-50%);
          filter: var(--utel-widget-icon-filter-blue);
          opacity: 0;
          transition: opacity 0.125s ease;
        }
        &:hover {
          img {
            opacity: 1;
          }
        }
      }

      .without-the-call-action {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:nth-child(2) {
        min-width: 180px;
      }
      &:nth-child(3) {
        text-align: center;
        min-width: 28ch;
      }
      &:nth-child(4) {
        text-align: center;
        min-width: 140px;
      }
      &:nth-child(5) {
        text-align: center;
        min-width: 160px;
      }
      &:nth-child(6) {
        text-align: left;
        min-width: 160px;
      }
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
    .calls {
      position: relative;
      div.raw {
        width: 100%;
        top: var(--from-top);
        &:nth-child(even) {
          background-color: var(--utel-widget-bg-011);
        }
        span {
          height: 20px;
          &:first-child {
            display: flex;
            align-items: center;
            .status-bar {
              height: 40px;
              width: 4px;
              margin-right: 8px;
              background-color: var(--utel-widget-icon-filter);
              opacity: 0.5;
            }
            img {
              height: 20px;
              filter: invert(100%);
            }
          }
        }
        &.incoming {
          span:first-child img {
            filter: var(--utel-widget-icon-filter-green);
          }
        }
        &.outgoing {
          span:first-child img {
            filter: var(--utel-widget-icon-filter-blue);
          }
        }
        &.missed {
          span:first-child .status-bar {
            background-color: var(--utel-red);
          }
          span:first-child img {
            filter: var(--utel-widget-icon-filter-red);
          }
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
.calls-table-rows-leave-to {
  opacity: 0;
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.calls-table-rows-leave-active {
  position: absolute;
}
</style>
