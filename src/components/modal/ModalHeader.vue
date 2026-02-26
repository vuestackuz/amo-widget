<template>
  <div id="utel-modal-header">
    <div class="title">
      <h3>История звонков</h3>
      <span id="sip-user-number" v-if="sipUserStore.sipUser?.attached">{{ sipUserStore.sipUser.attached }}</span>
      <div class="loading" :class="{spin: helpersStore.amo_api_loading || helpersStore.utel_api_loading}" >
        <img :src="imgLoading" alt="loading...">
      </div>
    </div>
    <button class="close-btn" @click="helpersStore.closeModal">×</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useHelpersStore } from '../../../stores/helpers';
import { useUtelSipUserStore } from '../../../stores/utel-api/sipUser';
import { widgetPath } from '../../utils/media_path';

const helpersStore = useHelpersStore()
const sipUserStore = useUtelSipUserStore()

const imgLoading = ref("icons/spin.svg");

onMounted(() => {
  imgLoading.value = widgetPath(imgLoading.value)
})
</script>

<style lang="scss" scoped>
#utel-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 66px;
  padding: 0px 24px;
  background: var(--utel-widget-bg-01);
  font-size: 18px;
  border-bottom: 1px solid var(--utel-widget-border-color);

  .title {
    display: flex;
    column-gap: 12px;
    align-items: baseline;
    h3 {
      font-size: 1.2rem;
      margin: 8px 0;
    }
    #sip-user-number {
      min-width: calc(4ch + 12px);
      height: 24px;
      font-size: 0.9rem;
      padding-bottom: 2px;
      transform: translateY(-1px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      border: 1px solid var(--utel-widget-border-color);
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
      img {
        height: 18px;
        aspect-ratio: 1 / 1;
        filter: invert(100%);
      }
      &.spin {
        animation-name: spin;
        animation-duration: 0.125s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        animation-fill-mode: forwards;
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 26px;
    cursor: pointer;
  }
}

@keyframes spin {
  to {
    opacity: 1;
    transform: rotate(360deg);
  }
}
</style>