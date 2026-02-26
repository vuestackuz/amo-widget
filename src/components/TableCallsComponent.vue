<template>
  <div id="utel-table-calls-component">
    <transition-group name="new-table-call" appear>
      <TableCallCard
        v-for="(sess, id) in {...sipStore.sessions, ...sipWSStore.passiveCalls}"
        :key="id"
        :session="sess"
        :style="{zIndex: 10500}"
      />
    </transition-group>
  </div>
</template>

<script setup lang="js">
import { useSipStore } from '../../stores/js-sip/sipStore';
import { useSipWSStore } from '../../stores/utel-api/utel-sip-ws';
import TableCallCard from './calls/TableCallCard.vue'

const sipStore = useSipStore()
const sipWSStore = useSipWSStore()

</script>

<style lang="scss" scoped>
#utel-table-calls-component {
  position: absolute;
  bottom: calc(100% + 12px);
  height: auto;
  min-height: 30px;
  max-height: calc(100vh - 240px);
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: 100%;
  padding: 0 20px;
}

.new-table-call-enter-active,
.new-table-call-leave-active {
  transition: all 0.25s ease;
}

.new-table-call-enter-from,
.new-table-call-leave-to {
  transform: scale(0.94) translateY(6px);
  opacity: 0;
}
</style>