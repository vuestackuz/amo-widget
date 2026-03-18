import { ref } from 'vue';

export function useCallPopout() {
  const showDial = ref(false);
  const showTransfer = ref(false);

  function showOrToggle(popup) {
    if (popup === 'dial') {
      showTransfer.value = false;
      showDial.value = !showDial.value;
    }
    if (popup === 'transfer') {
      showDial.value = false;
      showTransfer.value = !showTransfer.value;
    }
  }

  return { showDial, showTransfer, showOrToggle };
}
