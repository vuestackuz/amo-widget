import axios from 'axios'

const settings = window.__AMO_UTEL_WIDGET_SETTINGS__
const system = window.__AMO_UTEL_WIDGET_SYSTEM__

const api = axios.create({
  baseURL: `${settings?.domain}/api/v1/integration`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = settings?.token
    const amouserId = system?.amouser_id
    if (token) config.headers.Authorization = `Bearer ${token}`
    if (amouserId) config.headers['Amocrm-User-Id'] = amouserId
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
