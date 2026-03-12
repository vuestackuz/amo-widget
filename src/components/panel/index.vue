<script setup>
import Footer from './footer/index.vue';
const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<template>
    <div class="utel-widget-modal">
        <div class="utel-widget-modal__header">
            <h1 class="utel-widget-modal__title">Utel Widget Panel</h1>
            <button type="button" class="utel-widget-modal__close" aria-label="Close" @click="handleClose">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="utel-widget-modal-content">
            <h2>Utel Widget Panel</h2>
        </div>
        <Footer />
    </div>
</template>

<style lang="scss" scoped>
.utel-widget-modal {
  position: fixed;
  z-index: 9999;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  transition: opacity 0.25s;
  background-color: var(--utel-widget-bg-01);
  color: var(--utel-widget-text-color); 
  padding: 32px;
  min-width: 300px;
  min-height: 300px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  &__close {
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
}

.utel-widget-panel {
  width: 100%;
  height: 100%;
  background-color: transparent;
  color: inherit;
}
</style>