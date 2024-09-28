import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('token');

  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;