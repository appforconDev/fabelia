// ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(UserContext);

  console.log('ProtectedRoute - currentUser:', currentUser);

  if (loading) {
    return <div>Loading...</div>; // Eller en spinner
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
