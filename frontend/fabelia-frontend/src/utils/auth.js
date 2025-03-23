// src/utils/auth.js
import { jwtDecode } from 'jwt-decode'; // Namngiven import

export const setToken = (token) => {
  localStorage.setItem('access_token', token);
};

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const removeToken = () => {
  localStorage.removeItem('access_token');
};

export const getUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    if (exp < Date.now() / 1000) {
      removeToken();
      return false;
    }
    return true;
  } catch (error) {
    removeToken();
    return false;
  }
};
