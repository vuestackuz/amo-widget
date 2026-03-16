<template>
    <div class="call-card"
      :id="props.session.id"
      ref="callCardRef"
      @mousedown="onMouseDown"
      :style="computedStyle"
    >
      <CallCardPopout :show-dial="showDial" :session="props.session" :show-transfer="showTransfer"  :dial-buttons-style="dialButtonsStyle" :transfer-style="transferStyle" />
  
      <div class="left-side-indicator" :class="{active: props.session.isAccepted && !props.session.isOnHold}"></div>
      
      <div class="caller-info">
        <div>
          <strong>
            <button
              v-if="props.session.contact !== null && props.session.contact !== 'waiting_for_the_value'"
              @click="contactsStore.openWidgetPage(props.session.contact.contact_page_link)"
              >{{ props.session.contact?.name ? helpersStore.abbreviatedContactName(props.session.contact.name) : "" }}</button
            >
            <span v-else>{{ props.session.displayName }}</span>
          </strong>
          <span>{{ props.session.number }}</span>
        </div>
      </div>
  
      <div class="call-footer">
        <div class="left">
          <div class="duration">
            {{ formattedDuration }}
          </div>
        </div>
        <div class="right">
          <button class="add-contact-button" :style="{bottom: props.session.passiveCall?'26px':'38px'}" v-if="props.session.contact === null" @click="newContact(props.session.number, props.session.id)">
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
  
      <audio :id="`caller-voice-${props.session.id}`" autoplay playsinline></audio>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, onBeforeUnmount, provide } from 'vue';
  import { useCallActionsStore } from '../../../stores/js-sip/callActions';
  import { widgetPath } from "../../utils/media_path";
  import CallCardPopout from './CallCardPopout.vue';
  import { useSipStore } from '../../../stores/js-sip/sipStore';
  import { useContactsStore } from '../../../stores/amo-api/contacts';
  import { useHelpersStore } from '../../../stores/helpers';
  
  const props = defineProps(["session"]);
  const callActions = useCallActionsStore();
  const sipStore = useSipStore()
  const contactsStore = useContactsStore()
  const helpersStore = useHelpersStore()
  
  const imgAcceptCall = ref("icons/accept-call.svg")
  const imgTransferCall = ref("icons/transfer-call.svg")
  const imgMicOn = ref("icons/mic-on.svg")
  const imgMicOff = ref("icons/mic-off.svg")
  const imgDial = ref("icons/dial.svg")
  const imgHold = ref("icons/hold.svg")
  const imgResume = ref("icons/resume.svg")
  const imgRejectCall = ref("icons/reject-call.svg")
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
  
  const dialButtonsStyle = computed(() => ({
    right: '0',
    width: '100%'
  }));
  
  const transferStyle = computed(() => ({
    right: '0',
    width: '100%'
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
  // Draggable card
  // ----------------------
  const left = ref(null);
  const top = ref(null);
  
  let isDragging = false;
  let moved = false;
  let offsetX = 0;
  let offsetY = 0;
  
  const gap = 40; // Right and top/bottom gap
  const verticalGap = 8; // Gap between stacked cards vertically
  const horizontalGap = 8; // Gap between columns
  const bottomStart = 60; // Distance from bottom for first row
  
  const cardWidth = 260; // matches CSS width
  const cardHeight = cardWidth / 3.2; // matches aspect-ratio 3.2 / 1
  
  const computedStyle = computed(() => ({
    left: left.value + 'px',
    top: top.value + 'px',
    right: 'auto',
    bottom: 'auto',
  }));
  
  // ----------------------
  // Drag handlers
  // ----------------------
  function onMouseDown(e) {
    const btn = document.getElementById(props.session.id);
    if (!btn) return;
  
    const rect = btn.getBoundingClientRect();
  
    isDragging = true;
    moved = false;
  
    if (left.value === null || top.value === null) {
      left.value = rect.left;
      top.value = rect.top;
    }
  
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  
    btn.style.transition = 'none';
  }
  
  function onMouseMove(e) {
    if (!isDragging) return;
  
    moved = true;
  
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
    
    const btn = document.getElementById(props.session.id);
    if (!btn) return;
  
    const btnW = btn.offsetWidth;
    const btnH = btn.offsetHeight;
  
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
  
    const minLeft = gap;
    const maxLeft = winW - btnW - gap;
    const minTop = gap;
    const maxTop = winH - btnH - gap;
  
    if (newLeft < minLeft) newLeft = minLeft;
    if (newLeft > maxLeft) newLeft = maxLeft;
    if (newTop < minTop) newTop = minTop;
    if (newTop > maxTop) newTop = maxTop;
  
    left.value = newLeft;
    top.value = newTop;
  
    btn.style.cursor = 'move';
  }
  
  function onMouseUp() {
    if (!isDragging) return;
  
    isDragging = false;
    const btn = document.getElementById(props.session.id);
    if (btn) {
      btn.style.transition = '0.2s';
      btn.style.cursor = 'default';
    }
  }
  
  // ----------------------
  // Card placement logic
  // ----------------------
  function placeCard() {
    const btn = document.getElementById(props.session.id);
    if (!btn) return;
  
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
  
    const rowIndex = props.session.order % 4;
    const colIndex = Math.floor(props.session.order / 4);
  
    const bottomOffset = bottomStart + rowIndex * (cardHeight + verticalGap);
    const leftOffset =
      winW - gap - cardWidth - colIndex * (cardWidth + horizontalGap);
  
    left.value = leftOffset;
    top.value = winH - cardHeight - bottomOffset;
  }
  
  function clampCard() {
    if (left.value === null || top.value === null) return;
  
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
  
    left.value = Math.min(left.value, winW - cardWidth - gap);
    top.value = Math.min(top.value, winH - cardHeight - gap);
  }
  
  // ----------------------
  // Lifecycle
  // ----------------------
  onMounted(() => {
    imgAcceptCall.value = widgetPath(imgAcceptCall.value)
    imgTransferCall.value = widgetPath(imgTransferCall.value)
    imgMicOn.value = widgetPath(imgMicOn.value)
    imgMicOff.value = widgetPath(imgMicOff.value)
    imgDial.value = widgetPath(imgDial.value)
    imgHold.value = widgetPath(imgHold.value)
    imgResume.value = widgetPath(imgResume.value)
    imgRejectCall.value = widgetPath(imgRejectCall.value)
    imgAddContact.value = widgetPath(imgAddContact.value)
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    placeCard();
  
    window.addEventListener('resize', clampCard);
    window.visualViewport?.addEventListener('resize', clampCard);
  });
  
  onBeforeUnmount(() => {
    clearInterval(props.session.timer);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  
    window.removeEventListener('resize', clampCard);
    window.visualViewport?.removeEventListener('resize', clampCard);
  });
  </script>
  
  
  <style lang="scss" scoped>
  .call-card {
    position: absolute;
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
      &.active {
        background-color: var(--utel-green);
      }
    }
  
    .caller-info {
      & > div {
        display: flex;
        flex-direction: column;
        row-gap: 1px;
      }
      strong {
        font-size: 16px !important;
        button {
          color: var(--utel-blue);
          text-decoration: underline;
        }
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
      
      .left {
        .duration {
          font-size: 16px !important;
          opacity: 0.6;
        }
      }
  
      .right {
        position: relative;
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
          img {
            height: 22px;
            filter: var(--utel-widget-icon-filter-green);
          }
        }
      }
    }
  
    .call-card-popout {
      .dial-buttons {
        right: auto;
        width: 100%;
      }
      .transfer {
        right: auto;
        width: 100%;
      }
    }
  }
  
  </style>