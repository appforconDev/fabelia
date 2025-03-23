import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#282c34] text-white py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Första kolumnen */}
        <div>
          <h2 className="text-lg font-bold mb-4">Om Fabelia</h2>
          <p className="text-sm text-warmWhite mb-4">
            Fabelia är en plattform för att skapa personliga böcker och ljudböcker med hjälp av AI.
          </p>
          <p className="text-sm text-warmWhite">&copy; 2024 Fabelia. Alla rättigheter förbehållna.</p>
        </div>
        {/* Andra kolumnen */}
        <div>
          <h2 className="text-lg font-bold mb-4">Snabblänkar</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-gold transition-colors duration-300">
                Hem
              </Link>
            </li>
            <li>
              <Link to="/create" className="hover:text-gold transition-colors duration-300">
                Skapa Bok
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-gold transition-colors duration-300">
                Dashboard
              </Link>
            </li>
            <li>
              <a
                href="https://fabelia.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors duration-300"
              >
                Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
