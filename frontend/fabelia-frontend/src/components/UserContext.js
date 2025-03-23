import React, { createContext, useState, useEffect } from 'react';

// Skapa Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const addNotification = (message) => {
    setNotifications((prev) => [...prev, message]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateSelectedCategory = (category) => {
    setSelectedCategory(category);
  };

  // Funktion för att hämta användardata från backend
  const fetchUserFromDB = async (userId, retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        console.log(`Försök ${i + 1} att hämta användare med ID: ${userId}`);
        const response = await fetch(`http://localhost:5000/api/get-user?user_id=${userId}`);
        if (!response.ok) {
          throw new Error("Kunde inte hämta användardata");
        }
        const userData = await response.json();
        console.log("Hämtad användardata:", userData);
        return userData;
      } catch (error) {
        console.error(`Försök ${i + 1} misslyckades:`, error);
        if (i === retryCount - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponentiell backoff
      }
    }
    return null;
  };
  

// Anropa funktionen i useEffect när du hämtar användardata
useEffect(() => {
  let isMounted = true;

  const checkAndFetchUser = async () => {
    const userId = localStorage.getItem("user_id");
    console.log("Kontrollerar localStorage user_id:", userId);
    
    if (!userId) {
      if (isMounted) {
        console.log("Ingen user_id i localStorage - användaren är inte inloggad");
        setCurrentUser(null);
        setLoading(false);
      }
      return;
    }

    try {
      const userData = await fetchUserFromDB(userId);
      if (isMounted) {
        if (userData) {
          setCurrentUser(userData);
        } else {
          console.error("Kunde inte hämta användardata - loggar ut användaren");
          localStorage.removeItem('user_id');
          setCurrentUser(null);
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error("Fel vid hämtning av användardata:", error);
        setCurrentUser(null);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  checkAndFetchUser();

  return () => {
    isMounted = false;
  };
}, []);

const debugLocalStorage = () => {
  console.log('localStorage innehåll:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}: ${localStorage.getItem(key)}`);
  }
};

  



  // Hantera lyckad inloggning
  const handleSuccessfulLogin = async (user) => {
    console.log('Inloggning lyckades. Rådata:', user);
    
    // Extrahera korrekt ID från användardata
    const userId = user.username; // eftersom det verkar som att username innehåller ID
    
    if (userId) {
      try {
        // Hämta fullständig användardata från databasen
        const userData = await fetchUserFromDB(userId);
        
        if (userData) {
          console.log('Hämtad komplett användardata:', userData);
          localStorage.setItem('user_id', userId);
          setCurrentUser(userData);
          setIsLoginModalOpen(false);
        } else {
          console.error('Kunde inte hämta användardata efter inloggning');
        }
      } catch (error) {
        console.error('Fel vid hämtning av användardata efter inloggning:', error);
      }
    } else {
      console.error('Inloggad användare saknar giltigt ID');
    }
  };
  

  // Hantera utloggning
  const logout = () => {
    console.log('Loggar ut användaren.');
    localStorage.removeItem('user_id'); // Ta bort `user_id` från localStorage
    setCurrentUser(null);
  };

  const updateCredits = (newCredits) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        credits: newCredits, // Uppdatera krediter direkt i användarens data
      });
    }
  };

  // Kontrollera och logga användarens data vid varje uppdatering
  useEffect(() => {
    console.log('Uppdaterad currentUser:', currentUser);
  }, [currentUser]);

  // Tillhandahåll värden i Context
  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        isLoginModalOpen,
        updateCredits,
        notifications,
        addNotification,
        clearNotifications,
        setIsLoginModalOpen,
        handleSuccessfulLogin,
        logout,
        selectedCategory,
        updateSelectedCategory,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
