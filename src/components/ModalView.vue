<template>
    <transition name="utel-modal-appear" mode="out-in" appear>
      <div class="utel-modal" v-if="helpersStore.isModalOpen">
        <ModalHeader />
        <ModalBody />
        <ModalFooter />
      </div>
    </transition>
</template>

<script setup>
import { onMounted } from 'vue';
import { useHelpersStore } from '../../stores/helpers';
import ModalHeader from './modal/ModalHeader.vue'
import ModalBody from './modal/ModalBody.vue';
import ModalFooter from './modal/ModalFooter.vue';

const helpersStore = useHelpersStore()

onMounted(() => {
  // "Close modal" action for route change
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a');
    if (el && el.href.includes('amocrm')) {
      helpersStore.closeModal()
    }
  });
})
</script>

<style lang="scss" scoped>
.utel-modal {
  position: fixed;
  top: 0;
  left: var(--left-menu-width);
  width: calc(100vw - var(--left-menu-width));
  height: 100vh;
  background: var(--utel-widget-bg-02);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  z-index: 10500;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  * {
    color: var(--utel-widget-text-color);
  }
}

.utel-modal-appear-enter-active,
.utel-modal-appear-leave-active {
  transition: all 0.25s ease;
}

.utel-modal-appear-enter-from,
.utel-modal-appear-leave-to {
  transform: scale(0.98) rotateX(10deg);
  opacity: 0;
}
</style>