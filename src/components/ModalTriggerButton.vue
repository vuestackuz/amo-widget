<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useSipStore } from '../stores/sip.store';
import { useSipWSStore } from '../stores/sip-ws.store';
import { useUtelSipUserStore } from '../stores/sip-user.store';

const emit = defineEmits(['open']);

const sipStore = useSipStore();
const sipWSStore = useSipWSStore();
const sipUserStore = useUtelSipUserStore();

const isConnecting = computed(() => sipStore.isConnecting || sipWSStore.isConnecting);

const attachedNumber = computed(() => sipUserStore.sipUser?.attached ?? '-');
const badgeClass = computed(() => {
  if (sipStore.hasCredential && sipStore.isRegistered) return 'attached-number--credential';
  if (sipStore.hasCredential && !sipStore.isRegistered) return 'attached-number--offline';
  if (sipStore.hasAttached) return 'attached-number--attached';
  return null;
});

const btnRef = ref(null);

const STORAGE_KEY = 'utel-trigger-btn-pos';
const GAP = 12;
const SIZE = 60;

const left = ref(null);
const top = ref(null);

let isDragging = false;
let hasMoved = false;
let offsetX = 0;
let offsetY = 0;

const style = computed(() => {
  if (left.value === null || top.value === null) return {};
  return {
    left: left.value + 'px',
    top: top.value + 'px',
    right: 'auto',
    bottom: 'auto',
    transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
  };
});

function savePosition() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: left.value, top: top.value }));
}

function loadPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { left: l, top: t } = JSON.parse(saved);
      left.value = l;
      top.value = t;
      return true;
    }
  } catch {}
  return false;
}

function clamp() {
  const winW = window.visualViewport?.width ?? window.innerWidth;
  const winH = window.visualViewport?.height ?? window.innerHeight;
  left.value = Math.min(Math.max(left.value ?? 0, GAP), winW - SIZE - GAP);
  top.value = Math.min(Math.max(top.value ?? 0, GAP), winH - SIZE - GAP);
}

function setDefaultPosition() {
  const winW = window.visualViewport?.width ?? window.innerWidth;
  const winH = window.visualViewport?.height ?? window.innerHeight;
  left.value = winW - SIZE - 20;
  top.value = winH - SIZE - 20;
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  const rect = btnRef.value.getBoundingClientRect();
  isDragging = true;
  hasMoved = false;
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
}

function onMouseMove(e) {
  if (!isDragging) return;
  hasMoved = true;
  const winW = window.visualViewport?.width ?? window.innerWidth;
  const winH = window.visualViewport?.height ?? window.innerHeight;
  left.value = Math.min(Math.max(e.clientX - offsetX, GAP), winW - SIZE - GAP);
  top.value = Math.min(Math.max(e.clientY - offsetY, GAP), winH - SIZE - GAP);
}

function onMouseUp() {
  if (!isDragging) return;
  isDragging = false;
  if (hasMoved) {
    savePosition();
  } else {
    emit('open');
  }
}

function onResize() {
  if (left.value !== null) {
    clamp();
    savePosition();
  }
}

onMounted(() => {
  if (!loadPosition()) setDefaultPosition();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('resize', onResize);
  window.visualViewport?.removeEventListener('resize', onResize);
});
</script>

<template>
  <button
    ref="btnRef"
    class="utel-modal-trigger-button"
    :style="style"
    :class="{ dragging: isDragging && hasMoved }"
    @mousedown="onMouseDown"
  >
    <span
      v-if="attachedNumber || isConnecting"
      class="attached-number"
      :class="badgeClass"
    >
      <svg
        v-if="isConnecting"
        class="spinner"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" stroke-width="3" stroke-linecap="round" />
      </svg>
      {{ attachedNumber }}
    </span>
    <svg
      v-if="true"
      id="Layer_2"
      data-name="Layer 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 27.11 31.68"
    >
      <defs />
      <g
        id="Layer_2-2"
        data-name="Layer 2"
      >
        <path
          class="cls-1"
          d="M27.1,19.63c0,1.81-.32,3.46-.95,4.97-.6,1.47-1.49,2.74-2.66,3.82-1.17,1.04-2.59,1.84-4.27,2.41-1.67,.57-3.57,.85-5.67,.85s-4-.28-5.67-.85-3.1-1.37-4.27-2.41c-1.17-1.07-2.08-2.34-2.71-3.82-.6-1.51-.9-3.16-.9-4.97V.45c.37-.07,.95-.15,1.76-.25C2.55,.07,3.32,0,4.06,0s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.31c0,1.61,.44,2.86,1.31,3.77,.9,.9,2.06,1.36,3.46,1.36s2.59-.45,3.46-1.36c.87-.9,1.31-2.16,1.31-3.77V.45c.37-.07,.95-.15,1.76-.25,.8-.13,1.57-.2,2.31-.2s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.47h0Z"
        />
      </g>
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.utel-modal-trigger-button {
  position: fixed;
  z-index: 9999;
  width: 60px;
  height: 75px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  background-color: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  cursor: grab;
  user-select: none;
  padding: 0;
  &:hover {
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.2);
  }
  &.dragging {
    cursor: grabbing;
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.25);
  }
}

.icon {
  width: 28px;
  height: 28px;
  color: var(--utel-blue);
  pointer-events: none;
}

.attached-number {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Segoe UI', sans-serif;
  white-space: nowrap;
  pointer-events: none;
  color: #fff;
  background-color: var(--utel-red);
  padding: 2px 0;

  &--credential {
    background-color: var(--utel-green);
  }
  &--offline {
    background-color: var(--utel-red);
  }
  &--attached {
    background-color: hsl(25, 100%, 55%);
    color: #fff;
  }
}

svg {
  width: 35px;
  height: 60px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  .cls-1 {
    fill: var(--utel-blue);
  }
}

.spinner {
  width: 13px;
  height: 13px;
  animation: utel-spin 0.8s linear infinite;
}

@keyframes utel-spin {
  to { transform: rotate(360deg); }
}
</style>
