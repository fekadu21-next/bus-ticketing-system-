import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { NotificationProvider } from '@/context/NotificationContext';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppRoutes from '@/routes/AppRoutes';
import ErrorBoundary from '@/components/ErrorBoundary';

import '@/i18n';
import '@/index.css';
import './App.css';

function MainLayout() {
  const location = useLocation();
  const isConsoleRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/operator') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/management');

  if (isConsoleRoute) {
    return <AppRoutes />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content main-content--full">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppProvider>
                <MainLayout />
              </AppProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
