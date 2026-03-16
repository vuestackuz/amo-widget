<template>
  <div class="call-card-popout">
    <transition name="upper-section-showup" appear mode="out-in">
      <div v-if="props.showDial" class="dial-buttons" :style="props.dialButtonsStyle">
        <button v-for="(dial, index) in callActions.dials" :key="index" @click="callActions.sendDialTone(props.session.raw, dial.value)">{{ dial.name }}</button>
      </div>
      <div v-else-if="props.showTransfer" class="transfer" :style="props.transferStyle">
        <input
          :disabled="globals.mainDomain === null"
          @input="onPhoneInput"
          @keyup.enter="transferCall"
          type="text"
          :value="targetNumber"
          placeholder="Телефон или внутренний номер"
        >
        <button :disabled="globals.mainDomain === null" @click="transferCall">
          <IconTransferToNumber />
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGlobalsStore } from '../../../stores/globals';
import { useCallActionsStore } from '../../../stores/js-sip/callActions';
import IconTransferToNumber from '../../icons/IconTransferToNumber.vue';

const props = defineProps(["session", "showDial", "showTransfer", "dialButtonsStyle", "transferStyle"])

const globals = useGlobalsStore();
const callActions = useCallActionsStore();

const targetNumber = ref("");

function onPhoneInput(e) {
  const filtered = e.target.value.replace(/(?!^\+)\D/g, '');
  e.target.value = filtered;
  targetNumber.value = filtered;
}

function transferCall() {
  callActions.transferCall(props.session.raw, targetNumber.value);
}
</script>

<style lang="scss" scoped>
.call-card-popout {
  .dial-buttons {
    position: absolute;
    bottom: calc(100% + 6px);
    background-color: rgba($color: #000000, $alpha: 0.9);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 0;
    row-gap: 0;
    padding: 10px;
    border-radius: 10px;
    button {
      cursor: pointer;
      height: 32px;
      font-size: 16px;
      border-radius: 5px;
      background-color: transparent;
      border: none;
      outline: none;
      &:hover {
        background-color: rgba($color: #fff, $alpha: 0.1);
      }
      &:active {
        background-color: rgba($color: #fff, $alpha: 0.2);
      }
    }
  }

  .transfer {
    position: absolute;
    bottom: calc(100% + 6px);
    background-color: rgba($color: #000000, $alpha: 0.9);
    display: grid;
    grid-template-columns: auto 32px;
    column-gap: 6px;
    padding: 4px;
    border-radius: 10px;
    input {
      background-color: rgba($color: #fff, $alpha: 0.1);
      padding: 0px 6px;
      font-size: 12px !important;
      border-radius: 5px;
      border: none;
      outline: none;
      &::placeholder {
        font-size: 12px;
      }
    }
    button {
      cursor: pointer;
      height: 24px;
      font-size: 16px;
      border-radius: 5px;
      background-color: transparent;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        height: 20px !important;
        color: white;
      }
      &:hover {
        background-color: rgba($color: #fff, $alpha: 0.1);
      }
      &:active {
        background-color: rgba($color: #fff, $alpha: 0.2);
      }
    }
  }
}

.upper-section-showup-enter-active,
.upper-section-showup-leave-active {
  transition: all 0.25s cubic-bezier(0.075, 0.82, 0.165, 1);
}

.upper-section-showup-enter-from,
.upper-section-showup-leave-to {
  transform: translateY(10px) rotateX(25deg);
  opacity: 0;
}
</style>
