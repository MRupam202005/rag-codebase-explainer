// This file centralizes the API base URL for the frontend application.
// In development, it falls back to the local backend server (http://localhost:5000).
// In production, it defaults to an empty string to use relative paths, allowing Vercel rewrites to proxy to the EC2 instance without mixed-content errors.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
    ? import.meta.env.VITE_API_BASE_URL 
    : (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');
