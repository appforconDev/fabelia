# src/utils/auth.py
from jwt_decode import jwtDecode  # Namngiven import istället för default

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
  try:
    return jwtDecode(token);
  except Exception as error:
    return null;
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return False;
  try:
    const { exp } = jwtDecode(token);
    if (exp < Date.now() / 1000:
      removeToken();
      return False;
    return True;
  except Exception as error:
    removeToken();
    return False;
};
