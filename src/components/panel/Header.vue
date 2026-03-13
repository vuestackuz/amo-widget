<script setup>
import { useAmocrmStore } from '@/stores/amocrm.store';
import { storeToRefs } from 'pinia';

defineEmits(['close']);

const amocrmStore = useAmocrmStore();
const { sipUser } = storeToRefs(amocrmStore);
</script>

<template>
    <div class="utel-widget-modal__header">
        <div class="utel-widget-modal__header--left">
          <h1 class="utel-widget-modal__title">История звонков</h1>
          <div  class="utel-widget-modal__header--operator">
            <span>{{ sipUser.attached }}</span>
          </div>
        </div>
        <button type="button" class="utel-widget-modal__close" aria-label="Close" @click="$emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
</template>

<style lang="scss" scoped>
.utel-widget-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--utel-widget-border-color);
  padding: 16px 32px;

  &--left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &--operator {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid var(--utel-widget-border-color);
    font-size: 14px;
    font-weight: 700;
    color: var(--utel-widget-text-color);
  }
}

.utel-widget-modal__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.utel-widget-modal__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: var(--utel-widget-text-color);
}
</style>
