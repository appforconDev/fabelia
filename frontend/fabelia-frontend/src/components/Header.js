import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from './UserContext';
import CreditModal from './CreditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Header = ({ openLoginModal }) => {
  const { currentUser, logout, notifications, clearNotifications } = useContext(UserContext);
  const [credits, setCredits] = useState(0);
  const [isCreditModalOpen, setCreditModalOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false); // State för att toggla hamburgermenyn

  // Hämta användarens credits från databasen
  const fetchCredits = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/get-credits?user_id=${userId}`);
      if (!response.ok) throw new Error(`Serverfel: ${response.status}`);
      const data = await response.json();
      return data.credits;
    } catch (error) {
      console.error("Fel vid hämtning av credits:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!currentUser?.id) return;
      const credits = await fetchCredits(currentUser.id);
      setCredits(credits || 0);
    };

    if (currentUser) fetchUserCredits();
  }, [currentUser]);

  const handleOpenCreditModal = () => setCreditModalOpen(true);
  const handleCloseCreditModal = () => setCreditModalOpen(false);
  const toggleMenu = () => setMenuOpen(!isMenuOpen); // Funktion för att toggla meny

  return (
    <>
      <header className="header bg-[#282c34] text-white w-full fixed top-0 z-50 shadow-md">
  <div className="container flex max-w-none items-center justify-between px-4 py-3">
    {/* Logotyp */}
    <div className="flex items-center">
      <Link to="/">
        <img src="/images/logo.webp" alt="Fabelia" className="logo-image" />
      </Link>
      <h1 className="logo text-warmWhite font-bold text-xl ml-16 neon-text">
        <Link to="/">Fabelia</Link>
      </h1>
    </div>

    {/* Navigation för större skärmar */}
    <nav className="hidden lg:flex items-center"> {/* Ändra till lg för att gömma på mindre skärmar */}
      <ul className="text-warmWhite font-semibold flex items-center space-x-6">
        <li><Link to="/">Hem</Link></li>
        <li><Link to="/produkter">Böcker</Link></li>
        <li><Link to="/public">Publika</Link></li>
        <li><Link to="/affiliate">Affiliate</Link></li>
        <li><Link to="/skapa">Skapa Bok</Link></li>
        {currentUser ? (
          <>
            <li>
              <button
                onClick={handleOpenCreditModal}
                className="ml-2 bg-turquoise text-white px-3 py-1 rounded hover:bg-turquoise flex items-center space-x-2 transform transition-transform duration-200 hover:scale-110"
              >
                <FontAwesomeIcon icon={faStar} className="text-softYellow" />
                <span className="text-warmWhite font-semibold">{credits}</span>
              </button>
            </li>
            <li>
              <Link to="/dashboard" className="relative">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-warmWhite" />
                {currentUser.username || "Konto"}
                {notifications.length > 0 && (
                  <span
                    className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault();
                      clearNotifications();
                    }}
                    title="Rensa notifikationer"
                  >
                    {notifications.length}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <span
                onClick={logout}
                className="cursor-pointer hover:text-gold transition-colors duration-300"
              >
                Logga ut
              </span>
            </li>
          </>
        ) : (
          <li>
            <span
              onClick={openLoginModal}
              className="cursor-pointer hover:text-gold transition-colors duration-300"
            >
              Logga In
            </span>
          </li>
        )}
      </ul>
    </nav>

    {/* Hamburgermeny-knapp för mobila skärmar och iPad */}
    <button
      className="lg:hidden text-white focus:outline-none"
      onClick={toggleMenu}
    >
      <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="w-6 h-6" />
    </button>
  </div>

  {/* Mobilmeny */}
  {isMenuOpen && (
    <div className="lg:hidden absolute top-16 left-0 w-full bg-[#282c34] shadow-md">
      <ul className="flex flex-col text-center space-y-4 p-4">
        <li><Link to="/" className="block text-white" onClick={toggleMenu}>Hem</Link></li>
        <li><Link to="/produkter" className="block text-white" onClick={toggleMenu}>Produkter</Link></li>
        <li><Link to="/create" className="block text-white" onClick={toggleMenu}>Skapa Bok</Link></li>
        {currentUser ? (
          <>
            <li>
              <button
                onClick={handleOpenCreditModal}
                className="w-full bg-turquoise text-white px-3 py-2 rounded flex justify-center space-x-2"
              >
                <FontAwesomeIcon icon={faStar} className="text-softYellow" />
                <span className="text-warmWhite font-semibold">{credits}</span>
              </button>
            </li>
            <li>
              <Link to="/dashboard" className="block text-white" onClick={toggleMenu}>
                <FontAwesomeIcon icon={faUser} className="mr-2 text-warmWhite" />
                {currentUser.username || "Konto"}
              </Link>
            </li>
            <li>
              <span
                onClick={() => {
                  logout();
                  toggleMenu();
                }}
                className="block text-white cursor-pointer"
              >
                Logga ut
              </span>
            </li>
          </>
        ) : (
          <li>
            <span
              onClick={() => {
                openLoginModal();
                toggleMenu();
              }}
              className="block text-white cursor-pointer"
            >
              Logga In
            </span>
          </li>
        )}
      </ul>
    </div>
  )}
</header>


      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={handleCloseCreditModal}
      />
    </>
  );
};

export default Header;
