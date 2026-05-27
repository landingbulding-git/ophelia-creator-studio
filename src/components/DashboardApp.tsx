import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import Dashboard from './Dashboard';

export default function DashboardApp() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}