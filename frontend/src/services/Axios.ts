import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for cookies!
});

api.interceptors.response.use(
  (response) => response, // If request is good, just return it
  async (error) => {
    const originalRequest = error.config;

    // 1. FIX: Use optional chaining (?.) to prevent "cannot read status of undefined"
    const status = error.response?.status;

    // 2. FIX: Define which URLs should NEVER trigger a refresh logic
    // We don't want to try refreshing if the login or the refresh itself failed.
    const isAuthRequest = originalRequest.url.includes('/auth/login') || 
                          originalRequest.url.includes('/auth/refresh');

    // If the error is 401 and we haven't tried to refresh yet
    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        // Call your Proxy's refresh endpoint
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        console.log("Token refreshed successfully");
        
        // If refresh worked, the browser now has a NEW session_token cookie.
        // Just retry the original request!
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Refresh token also expired? User MUST log in again.
        if (!window.location.href.includes('/login')) {
            window.location.href = '/login';
        }   
        localStorage.removeItem('sigaa-user-storage');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;