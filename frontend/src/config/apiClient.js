import axios from 'axios';
import { API_BASE_URL } from './api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Crucial for sending and receiving httpOnly cookies
});

// Intercept requests to add the Authorization header if we still want to use it
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Unauthorized errors and refresh tokens
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if it's the refresh token endpoint itself failing
            if (originalRequest.url.includes('/api/refresh-access-token') || originalRequest.url.includes('/api/auth/login')) {
                // If refresh token fails, clear local storage and redirect to login
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Attempt to refresh the token. 
                // The backend relies on the httpOnly cookie 'refreshToken' being sent automatically.
                const res = await axios.post(`${API_BASE_URL}/api/refresh-access-token`, {}, { withCredentials: true });
                
                if (res.data.data.accessToken) {
                    // Update the local storage with the new access token
                    localStorage.setItem('token', res.data.data.accessToken);
                    
                    // Update the authorization header for the original request
                    originalRequest.headers['Authorization'] = `Bearer ${res.data.data.accessToken}`;
                    
                    // Retry the original request
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails (e.g., refresh token expired), clear state and go to login
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;
