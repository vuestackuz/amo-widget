import { defineStore } from 'pinia'
import { useHelpersStore } from '../helpers';
import utel_endpoints from './utelEndpoints';
import { computed, ref } from 'vue';
import axios from 'axios';
import logger from '../../src/composables/logger';

export const useUtelSipUserStore = defineStore('sip-user', () => {

  const helpersStore = useHelpersStore()

  const sipUser = ref(null)
  const sipUser_websocket = ref(null)

  // Sip user indicators:
  const notConnectedSipUser = computed(() => {
    if(sipUser.value) {
      if(sipUser.value.attached === null) {
        return 1 // notConnectedSipUser
      } else {
        return 2 // we have sip info and sip user number
      }
    }
    return 3 // we are not getting sip info yet
  })
  const noOtherSoftPhoneConnection = computed(() => {
    if(sipUser.value) {
      if(sipUser.value.credential !== null && sipUser.value.contact === null) {
        return 1 // noOtherSoftPhoneConnection
      } else if(sipUser.value.credential !== null) {
        return 2 // might be some edge case but still: noOtherSoftPhoneConnection
      } else if(sipUser.value.credential === null && sipUser.value.contact !== null) {
        return 4 // it has OtherSoftPhoneConnection
      } else {
        return 5 // some other problem with sip info
      }
    }
    return 3 // we are not getting sip info yet
  })
  
  async function getSipUserInfo(amoCRMUserId, domain, token) {
    helpersStore.utel_api_loading = true;
    try {
      const response = await axios.get(`https://${domain}${utel_endpoints.SipUserInfo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Amocrm-User-Id': amoCRMUserId
        }
      });
      sipUser.value = response.data.result.sip_user;
      sipUser_websocket.value = response.data.result.websocket;
    } catch (error) {
      sipUser.value = null
      logger.error("Error when getting sip user info from UTeL platform:", error);
    }
    helpersStore.utel_api_loading = false;
  }
  
  async function originateTo(amoCRMUserId, domain, token, exten, name="Originate from AmoCRM widget") {
    helpersStore.utel_api_loading = true;
    try {
      const response = await axios.post(`https://${domain}${utel_endpoints.Originate}`,
        {
          exten: exten,
          name: name
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Amocrm-User-Id': amoCRMUserId
          }
        }
      );
    } catch (error) {
      logger.error(`Originating to the number ${exten} is failed`, error);
    }
    helpersStore.utel_api_loading = false;
  }

  return {
    sipUser,
    sipUser_websocket,
    notConnectedSipUser, 
    noOtherSoftPhoneConnection,
    getSipUserInfo,
    originateTo
  }
})
