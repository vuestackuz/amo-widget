<template>
  <button
    ref="btnRef"
    @mousedown="onMouseDown"
    @click="handleClick"
    :style="computedStyle"
    class="utel-floating-btn"
  >
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.11 31.68">
      <defs class="cls-1">
      </defs>
      <g id="Layer_2-2" data-name="Layer 2">
        <path class="cls-1" d="M27.1,19.63c0,1.81-.32,3.46-.95,4.97-.6,1.47-1.49,2.74-2.66,3.82-1.17,1.04-2.59,1.84-4.27,2.41-1.67,.57-3.57,.85-5.67,.85s-4-.28-5.67-.85-3.1-1.37-4.27-2.41c-1.17-1.07-2.08-2.34-2.71-3.82-.6-1.51-.9-3.16-.9-4.97V.45c.37-.07,.95-.15,1.76-.25C2.55,.07,3.32,0,4.06,0s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.31c0,1.61,.44,2.86,1.31,3.77,.9,.9,2.06,1.36,3.46,1.36s2.59-.45,3.46-1.36c.87-.9,1.31-2.16,1.31-3.77V.45c.37-.07,.95-.15,1.76-.25,.8-.13,1.57-.2,2.31-.2s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.47h0Z"/>
      </g>
    </svg>

  </button>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { widgetPath } from "../utils/media_path";
import { useHelpersStore } from "../../stores/helpers";

const helpersStore = useHelpersStore()
const btnRef = ref(null);

const left = ref(null);
const top = ref(null);

let isDragging = false;
let moved = false;
let offsetX = 0;
let offsetY = 0;

const gap = 30;

const computedStyle = computed(() => {
  if (left.value === null || top.value === null) {
    return {
    };
  }

  return {
    left: left.value + "px",
    top: top.value + "px",
    right: "auto",
    bottom: "auto"
  };
});

function onMouseDown(e) {
  const btn = btnRef.value;
  if (!btn) return;

  const rect = btn.getBoundingClientRect();

  isDragging = true;
  moved = false;

  if (left.value === null || top.value === null) {
    left.value = rect.left;
    top.value = rect.top;
  }

  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  btn.style.transition = "none";
}

function onMouseMove(e) {
  if (!isDragging) return;

  moved = true;

  const vp = window.visualViewport;
  const winW = vp ? vp.width : window.innerWidth;
  const winH = vp ? vp.height : window.innerHeight;
  const btn = btnRef.value;
  if (!btn) return;

  const btnW = btn.offsetWidth;
  const btnH = btn.offsetHeight;

  let newLeft = e.clientX - offsetX;
  let newTop = e.clientY - offsetY;

  const minLeft = winW - 400 - btnW;
  const maxLeft = winW - btnW - gap;
  const minTop = gap;
  const maxTop = winH - btnH - gap;

  if (newLeft < minLeft) newLeft = minLeft;
  if (newLeft > maxLeft) newLeft = maxLeft;
  if (newTop < minTop) newTop = minTop;
  if (newTop > maxTop) newTop = maxTop;

  left.value = newLeft;
  top.value = newTop;
}

function onMouseUp() {
  if (!isDragging) return;

  isDragging = false;

  const btn = btnRef.value;
  if (btn) btn.style.transition = "0.2s";
}

// safe click here - cancel if being dragged
function handleClick(e) {
  if (moved) {
    e.stopImmediatePropagation();
    return;
  }
  // normal click:
  helpersStore.toggleModal()
}

const MainButtonImage = ref("logo.svg");

function clampPosition() {
  if (left.value === null || top.value === null) return;

  const vp = window.visualViewport;
  const winW = vp ? vp.width : window.innerWidth;
  const winH = vp ? vp.height : window.innerHeight;

  const btn = btnRef.value;
  if (!btn) return;

  left.value = Math.min(left.value, winW - btn.offsetWidth - gap);
  top.value = Math.min(top.value, winH - btn.offsetHeight - gap);
}

onMounted(() => {
  MainButtonImage.value = widgetPath(MainButtonImage.value);

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  window.addEventListener("resize", clampPosition);
  window.visualViewport?.addEventListener("resize", clampPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  window.removeEventListener("resize", clampPosition);
  window.visualViewport?.removeEventListener("resize", clampPosition);
});
</script>

<style lang="scss" scoped>
.utel-floating-btn {
  border: none;
  position: fixed;
  right: 40px;
  bottom: 60px;
  width: 42px;
  height: 42px;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  z-index: 10400;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);

  background-size: 60%;
  background-position: center center;
  background-repeat: no-repeat;

  animation: appearBtn 0.5s ease forwards;
  opacity: 0;
  transform: scale(0.5);
}

@keyframes appearBtn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cls-1 {
  fill: #008bf1;
}
</style>
