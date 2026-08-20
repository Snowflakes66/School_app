import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('access_token', accessToken)
    await SecureStore.setItemAsync('refresh_token', refreshToken)
    set({ user, accessToken, isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('access_token')
    if (token) {
      set({ accessToken: token, isAuthenticated: true })
    }
  },
}))

export default useAuthStore