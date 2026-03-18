import axios from 'axios'

const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — set baseURL and attach auth headers lazily
api.interceptors.request.use(
  (config) => {
    const settings = window.__AMO_UTEL_WIDGET_SETTINGS__
    const system = window.__AMO_UTEL_WIDGET_SYSTEM__

    if (settings?.domain) {
      config.baseURL = `${settings.domain}/api/v1/integration`
    }
    if (settings?.token) config.headers.Authorization = `Bearer ${settings.token}`
    if (system?.amouser_id) config.headers['Amocrm-User-Id'] = system.amouser_id

    return config
  }
)

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('utel-widget:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
