// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider, UserContext } from './components/UserContext';
import StoryForm from './components/StoryForm/StoryForm';
import './App.css';
import PublicBooksPage from './components/PublikBooksPage';
import ProductsDashboard from './components/ProductsDashboard'; // Importera ProductsDashboard
import AffiliatePromoCode from './components/AffiliatePromoCode';

function AppRoutes() {
  const {
    loading,
    isLoginModalOpen,
    setIsLoginModalOpen,
    handleSuccessfulLogin,
  } = React.useContext(UserContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header openLoginModal={() => setIsLoginModalOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/skapa"
              element={
                <ProtectedRoute>
                  <StoryForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/affiliate"
              element={
                <ProtectedRoute>
                  <AffiliatePromoCode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produkter"
              element={
                <ProtectedRoute>
                  <ProductsDashboard /> {/* Använd ProductsDashboard */}
                </ProtectedRoute>
              }
            />
            <Route path="/public" element={<PublicBooksPage />} />
          </Routes>
        </main>
        <Footer />
        <AuthModal
          isOpen={isLoginModalOpen}
          closeModal={() => setIsLoginModalOpen(false)}
          onSuccessfulLogin={handleSuccessfulLogin}
        />
      </div>
    </Router>
  );
}

function App() {
  const handleFormSubmit = async (formData) => {
    try {
      const response = await fetch('/create-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create script');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during form submission:', error);
      throw error;
    }
  };

  return (
    <UserProvider handleFormSubmit={handleFormSubmit}>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;