import axios from 'axios'

const api = axios.create({
  baseURL: `${window.__AMO_UTEL_WIDGET_SETTINGS__.domain}/api/v1/integration`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = window.__AMO_UTEL_WIDGET_SETTINGS__.token
    const amouser_id = window.__AMO_UTEL_WIDGET_SYSTEM__.amouser_id
    if (token) config.headers.Authorization = `Bearer ${token}`
    if (amouser_id) config.headers['Amocrm-User-Id'] = amouser_id
    return config
  }
)

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // redirect to login or refresh token
    }
    return Promise.reject(error)
  }
)

export default api
