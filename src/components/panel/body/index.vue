<template>
  <div id="utel-modal-body">
    <div class="utel-calls-history-filters">
      <button v-for="item in tabs" :key="item.slug" class="tab" :class="{ active: item.slug === activeSlug }" @click="activeSlug = item.slug">
        <span>{{ item.name }}</span>
      </button>
    </div>
    <CallsHistoryTable :calls="filteredCalls" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAmoCallsStore } from '../../../stores/amo-calls.store';
import CallsHistoryTable from './CallsHistoryTable.vue';

const amoCallsStore = useAmoCallsStore();

const tabs = [
  { slug: 'all',      name: 'Все' },
  { slug: 'incoming', name: 'Входящие' },
  { slug: 'outgoing', name: 'Исходящие' },
  { slug: 'missed',   name: 'Пропущенные' },
];

const activeSlug = ref('all');

const filteredCalls = computed(() => {
  const all = amoCallsStore.formattedCalls;
  switch (activeSlug.value) {
    case 'incoming': return all.filter(c => c.direction === 'incoming');
    case 'outgoing': return all.filter(c => c.direction === 'outgoing');
    case 'missed':   return all.filter(c => [2, 5, 6].includes(c.call_status[0]));
    default:         return all;
  }
});
</script>

<style lang="scss" scoped>
#utel-modal-body {
  padding: 0px;
  background: var(--utel-widget-bg-02);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;

  .utel-calls-history-filters {
    display: flex;
    height: 42px;
    background: var(--utel-widget-bg-01);
    border-bottom: 2px solid var(--utel-widget-border-color);
    flex-shrink: 0;
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
        color: var(--utel-widget-text-color);
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
        &::before { width: 80%; }
      }
    }
  }
}
</style>
