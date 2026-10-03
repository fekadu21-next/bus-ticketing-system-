import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppRoutes from '@/routes/AppRoutes';
import '@/i18n';
import '@/styles/landing.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
