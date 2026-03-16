<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: String,
  label: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['toggle']);

const isActive = ref(false);

const toggle = () => {
  isActive.value = !isActive.value;
  emit('toggle', isActive.value);
}
</script>

<template>
  <button
    :title="title"
    class="utel-widget-sip-control-button"
    :class="{active: isActive}"
    @click="toggle"
  >
    <slot>
      <span>{{ label }}</span>
    </slot>
  </button>
</template>

<style lang="scss" scoped>
.utel-widget-sip-control-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.4;
  font-weight: 600;
  color: var(--utel-widget-text-color);
  font-size: calc(0.8 * var(--utel-widget-font-size)) !important;
  transition: all 0.25s ease;

  &.active {
    opacity: 1;
  }
}
</style>
