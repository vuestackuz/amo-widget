<template>
  <div v-if="Object.keys(allCalls).length" id="utel-table-calls-panel">
    <transition-group name="table-call" appear>
      <TableCallCard
        v-for="(sess, id) in allCalls"
        :key="id"
        :session="sess"
      />
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSipStore } from '../../../stores/sip.store';
import { useSipWSStore } from '../../../stores/sip-ws.store';
import TableCallCard from './TableCallCard.vue';

const sipStore = useSipStore();
const sipWSStore = useSipWSStore();

const allCalls = computed(() => {
  const result = { ...sipStore.sessions };
  for (const [id, call] of Object.entries(sipWSStore.passiveCalls)) {
    if (!result[id]) result[id] = call;
  }
  return result;
});
</script>

<style lang="scss" scoped>
#utel-table-calls-panel {
  width: 100%;
  border-bottom: 1px solid var(--utel-widget-border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.table-call-enter-active,
.table-call-leave-active {
  transition: all 0.25s ease;
}

.table-call-enter-from,
.table-call-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
