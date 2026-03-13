<script setup>
import Footer from './footer/index.vue';
import Header from './Header.vue';
const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<template>
    <div class="utel-widget-modal">
        <Header @close="handleClose" />
        <div class="utel-widget-modal__content">
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
  min-width: 300px;
  min-height: 300px;

  &__content {
    padding: 16px 32px;
  }
}
</style>
