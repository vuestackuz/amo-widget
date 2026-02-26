<template>
  <div id="utel-modal-body">
    <div class="utel-calls-history-filters">
      <button v-for="item in amoCallsStore.tabs" :key="item.id" class="tab" :class="{active: item.active}" @click="activateFilterTab(item)">
        <span>{{ item.name }}</span>
      </button>
    </div>
    <CallsHistoryTable />
  </div>
</template>

<script setup>
import { useAmoCallsStore } from '../../../stores/amo-api/amo-calls';
import CallsHistoryTable from './CallsHistoryTable.vue';

const amoCallsStore = useAmoCallsStore()

const activateFilterTab = (activeTab) => {
  amoCallsStore.tabs.forEach((item, index, arr) => {
    if(item.name === activeTab.name) {
      arr[index].active = true
    } else {
      arr[index].active = false
    }
  })
}
</script>

<style lang="scss" scoped>
#utel-modal-body {
  
  padding: 0px;
  background: var(--utel-widget-bg-02);
  
  .utel-calls-history-filters {
    display: flex;
    height: 42px;
    background: var(--utel-widget-bg-01);
    border-bottom: 2px solid var(--utel-widget-border-color);
    .tab {
      background-color: transparent;
      padding: 0 20px;
      height: 100%;
      border: none;
      outline: none;
      cursor: pointer;
      span {
        display: flex;
        font-size: calc(0.9 * var(--utel-widget-font-size));
        font-weight: 600;
        opacity: 0.7;
        transition: all 0.25s ease;
        position: relative;
        &::before {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          background-color: var(--utel-widget-text-color);
          top: 125%;
          left: 50%;
          border-radius: 1000px;
          transform: translateX(-50%);
          transition: all 0.25s ease;
        }
      }
      &.active span {
        opacity: 1;
        transform: translateY(-2px);
        &::before {
          width: 80%;
        }
      }
    }
  }


}
</style>