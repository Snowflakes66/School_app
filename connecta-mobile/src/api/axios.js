import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Replace with your PC's local IP address
// To find it: run 'ipconfig' in terminal and look for IPv4 Address
const API_BASE = 'http://10.67.161.51:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = await SecureStore.getItemAsync('refresh_token')
      if (!refresh) {
        await SecureStore.deleteItemAsync('access_token')
        await SecureStore.deleteItemAsync('refresh_token')
        return Promise.reject(error)
      }
      try {
        const res = await axios.post(`${API_BASE}/auth/token/refresh/`, {
          refresh,
        })
        const newAccess = res.data.access
        await SecureStore.setItemAsync('access_token', newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync('access_token')
        await SecureStore.deleteItemAsync('refresh_token')
      }
    }
    return Promise.reject(error)
  }
)

export default api