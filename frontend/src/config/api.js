// This file centralizes the API base URL for the frontend application.
// In development, it falls back to the local backend server (http://localhost:5000).
// In production, it uses the environment variable VITE_API_BASE_URL.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
