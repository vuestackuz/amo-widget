import { defineStore } from 'pinia'
import { ref } from 'vue'
import logger from '../src/composables/logger'

export const useHelpersStore = defineStore('helpers', () => {

  // Global "loading" indicators:

  const amo_api_loading = ref(false)
  const utel_api_loading = ref(false)

  // ----------
  
  // UTeL Modal control:
  
  const isModalOpen = ref(false);
  const toggleModal = () => {
    isModalOpen.value = !isModalOpen.value
  }
  const closeModal = () => {
    isModalOpen.value = false
  }
  
  // ----------
  
  function abbreviatedContactName(name) {
    try {
      const nameValue = name.toString()
      if(nameValue.length <= 24) return nameValue
      const shortOne = nameValue.substr(0, 24) + "..."
      return shortOne
    } catch(err) {
      logger.error("Contact name error: ", err);
      return name
    }
  }

  return {
    amo_api_loading,
    utel_api_loading,
    isModalOpen,
    toggleModal,
    closeModal,
    abbreviatedContactName
  }
})