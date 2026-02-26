<template>
  <button
    ref="btnRef"
    @mousedown="onMouseDown"
    @click="handleClick"
    :style="computedStyle"
    class="utel-floating-btn"
  />
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
      backgroundImage: `url('${MainButtonImage.value}')`
    };
  }

  return {
    left: left.value + "px",
    top: top.value + "px",
    right: "auto",
    bottom: "auto",
    backgroundImage: `url('${MainButtonImage.value}')`
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
</style>
