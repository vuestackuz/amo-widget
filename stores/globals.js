import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useGlobalsStore = defineStore('globals', () => {
  const settings = ref(null)
  const system = ref(null)

  const hostname = computed(() => {
    if(settings.value?.domain) {
      return new URL(settings.value?.domain).hostname
    }
    return null
  })

  const mainDomain = computed(() => {
    if(hostname.value !== null) {
      return hostname.value.replace("api.", "")
    }
    return null
  })

  return {
    settings,
    system,
    hostname,
    mainDomain
  }
})