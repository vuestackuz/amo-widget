import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const GAP = 40;
const VERTICAL_GAP = 8;
const HORIZONTAL_GAP = 8;
const BOTTOM_START = 60;
const CARD_WIDTH = 260;
const CARD_HEIGHT = CARD_WIDTH / 3.2;

export function useDraggable(session) {
  const left = ref(null);
  const top = ref(null);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const computedStyle = computed(() => ({
    left: left.value + 'px',
    top: top.value + 'px',
    right: 'auto',
    bottom: 'auto',
  }));

  function getEl() {
    return document.getElementById(session.id);
  }

  function onMouseDown(e) {
    const el = getEl();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    isDragging = true;
    if (left.value === null || top.value === null) {
      left.value = rect.left;
      top.value = rect.top;
    }
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    el.style.transition = 'none';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
    const el = getEl();
    if (!el) return;
    left.value = Math.min(Math.max(e.clientX - offsetX, GAP), winW - el.offsetWidth - GAP);
    top.value = Math.min(Math.max(e.clientY - offsetY, GAP), winH - el.offsetHeight - GAP);
    el.style.cursor = 'move';
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    const el = getEl();
    if (el) {
      el.style.transition = '0.2s';
      el.style.cursor = 'default';
    }
  }

  function placeCard() {
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
    const rowIndex = session.order % 4;
    const colIndex = Math.floor(session.order / 4);
    const bottomOffset = BOTTOM_START + rowIndex * (CARD_HEIGHT + VERTICAL_GAP);
    left.value = winW - GAP - CARD_WIDTH - colIndex * (CARD_WIDTH + HORIZONTAL_GAP);
    top.value = winH - CARD_HEIGHT - bottomOffset;
  }

  function clampCard() {
    if (left.value === null || top.value === null) return;
    const vp = window.visualViewport;
    const winW = vp ? vp.width : window.innerWidth;
    const winH = vp ? vp.height : window.innerHeight;
    left.value = Math.min(left.value, winW - CARD_WIDTH - GAP);
    top.value = Math.min(top.value, winH - CARD_HEIGHT - GAP);
  }

  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    placeCard();
    window.addEventListener('resize', clampCard);
    window.visualViewport?.addEventListener('resize', clampCard);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('resize', clampCard);
    window.visualViewport?.removeEventListener('resize', clampCard);
  });

  return { computedStyle, onMouseDown };
}
