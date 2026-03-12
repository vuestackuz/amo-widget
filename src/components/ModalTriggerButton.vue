<script setup>
defineEmits(['open']);
</script>

<template>
  <button class="utel-modal-trigger-button" @click="$emit('open')">
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.11 31.68">
    <defs>
    </defs>
    <g id="Layer_2-2" data-name="Layer 2">
        <path class="cls-1" d="M27.1,19.63c0,1.81-.32,3.46-.95,4.97-.6,1.47-1.49,2.74-2.66,3.82-1.17,1.04-2.59,1.84-4.27,2.41-1.67,.57-3.57,.85-5.67,.85s-4-.28-5.67-.85-3.1-1.37-4.27-2.41c-1.17-1.07-2.08-2.34-2.71-3.82-.6-1.51-.9-3.16-.9-4.97V.45c.37-.07,.95-.15,1.76-.25C2.55,.07,3.32,0,4.06,0s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.31c0,1.61,.44,2.86,1.31,3.77,.9,.9,2.06,1.36,3.46,1.36s2.59-.45,3.46-1.36c.87-.9,1.31-2.16,1.31-3.77V.45c.37-.07,.95-.15,1.76-.25,.8-.13,1.57-.2,2.31-.2s1.44,.07,2.01,.2c.6,.1,1.1,.3,1.51,.6,.4,.3,.7,.72,.9,1.26,.2,.54,.3,1.24,.3,2.11v15.47h0Z"/>
    </g>
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.utel-modal-trigger-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  color: var(--utel-widget-text-color);
  border: none;
  border-radius: 8px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.2);
  }
}

svg {
  width: 40px;
  height: 40px;

  .cls-1 {
    fill: var(--utel-blue);
  }
}
</style>