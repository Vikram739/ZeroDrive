import axios from 'axios'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await auth.signOut()
      } catch {
        // signOut errors can be safely ignored here
      }
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export default api
