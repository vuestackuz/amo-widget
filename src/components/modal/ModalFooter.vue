<template>

  <div id="utel-modal-footer">
    <div class="footer-left" v-if="sipUserStore.notConnectedSipUser === 2 && [1,2].includes(sipUserStore.noOtherSoftPhoneConnection)">
      <div class="footer-call">
        <input ref="input" type="text" @keyup.enter="Call()" v-model="callNumber" placeholder="Введите номер телефона">
        <button @click="Call()">
          <img :src="imgNumberCall" alt="call to the number"></img>
        </button>
      </div>
      <button title="DND" @click="sipStore.setDND(!sipStore.dnd)" :class="{active: sipStore.dnd}">
        <span>Не беспокоить</span>
      </button>
      <button title="Multichannel" @click="sipStore.setMultiChannel(!sipStore.multiChannel)" :class="{active: sipStore.multiChannel}">
        <span>Многоканальность</span>
      </button>
    </div>
    <div v-else class="no-sip-user-data">
      {{ sipUserStore.sipUser.contact?.user_agent?sipUserStore.sipUser.contact?.user_agent:"Пользователь SIP не подключен!" }}
    </div>
    <div class="footer-right">
      <span class="version" v-if="globals.settings">v{{globals.settings.version}}</span>
    </div>
    
    <TableCallsComponent />

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useGlobalsStore } from '../../../stores/globals';
import { useSipStore } from '../../../stores/js-sip/sipStore';
import { widgetPath } from '../../utils/media_path'
import TableCallsComponent from '../TableCallsComponent.vue';
import { useUtelSipUserStore } from '../../../stores/utel-api/sipUser';

const globals = useGlobalsStore()
const sipStore = useSipStore()
const sipUserStore = useUtelSipUserStore()

const imgNumberCall = ref("./src/assets/icons/number-call.svg")

const callNumber = ref("")
const input = ref(null)

async function Call() {
  if(globals.mainDomain !== null) {
    const session = await sipStore.makeCall(callNumber.value, globals.mainDomain)
    if(session !== null) {
      callNumber.value = ""
    }
  }
}

onMounted(() => {
  imgNumberCall.value = widgetPath(imgNumberCall.value)
  if(input.value) {
    input.value.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/(?!^\+)\D/g, '');
    });
  }
})
</script>

<style lang="scss" scoped>
#utel-modal-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 66px;
  padding: 0;
  background: var(--utel-widget-bg-03);
  font-size: 14px;
  border-top: 1px solid var(--utel-widget-border-color);
}

.footer-left {
  display: flex;
  align-items: center;
  column-gap: 16px;
  height: 100%;
  padding: 14px 0;
  padding-left: 20px;

  & > button {
    background-color: transparent;
    border: none;
    cursor: pointer;
    span {
      opacity: 0.4;
      font-weight: 600;
      font-size: calc(0.8 * var(--utel-widget-font-size)) !important;
      transition: all 0.25s ease;
    }
    &.active {
      span {
        opacity: 1;
      }
    }
  }

  .footer-call {
    display: flex;
    column-gap: 8px;
    background-color: var(--utel-widget-bg-01);
    height: 42px;
    border-radius: 10px;
    overflow: hidden;
    input {
      width: 25ch;
      margin-left: 10px;
      background-color: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      &::placeholder {
        color: rgba($color: #fff, $alpha: 0.3);
      }
    }
    button {
      cursor: pointer;
      border: none;
      outline: none;
      height: 100%;
      width: 42px;
      background-color: rgba($color: #000, $alpha: 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        height: 20px;
        filter: var(--utel-widget-icon-filter-green);
      }
      &:active {
        background-color: rgba($color: #000, $alpha: 0.2);
      }
    }
  }


}

.no-sip-user-data {
  padding-left: 20px;
  color: var(--utel-red) !important;
}

.footer-right {
  padding-right: 20px;
  .version {
    opacity: 0.6;
    font-size: 12px;
  }
}

</style>