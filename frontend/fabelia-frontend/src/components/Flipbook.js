import React, { useState, useEffect } from 'react';
import './Flipbook.css';
import HTMLFlipBook from 'react-pageflip';

const Flipbook = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Kontrollera om det är en mobil enhet

  // Uppdatera isMobile vid fönsterstorleksändring
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigera till nästa sida
  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Navigera till föregående sida
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Mobilvisning: Visa en sida i taget
  if (isMobile) {
    return (
      <div className="mobile-flipbook">
        <div className="page-content">
          <img 
            src={pages[currentPage]} 
            alt={`Page ${currentPage + 1}`}
            className="page-image"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div className="mobile-navigation flex justify-between items-center w-full ">
  <span
    onClick={goToPreviousPage}
    className={`navigation-link ${currentPage === 0 ? 'disabled' : ''}`}
    style={{ cursor: currentPage === 0 ? 'default' : 'pointer' }}
  >
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ← Föregående &nbsp;&nbsp;
  </span>
  <span className="page-indicator">
     {currentPage + 1} av {pages.length} &nbsp;&nbsp;
  </span>
  <span
    onClick={goToNextPage}
    className={`navigation-link ${currentPage === pages.length - 1 ? 'disabled' : ''}`}
    style={{ cursor: currentPage === pages.length - 1 ? 'default' : 'pointer' }}
  >
    Nästa →
  </span>
</div>



      </div>
    );
  }

  // Desktop-visning: Använd HTMLFlipBook för att visa två sidor i taget
  return (
    <div className="flipbook-wrapper">
      <HTMLFlipBook 
        width={595.28} // A4-bredd
        height={841.89} // A4-höjd
        size="fixed"
        minWidth={595.28}
        maxWidth={595.28}
        minHeight={841.89}
        maxHeight={841.89}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className="custom-flipbook"
        startPage={0}
        drawShadow={true}
        flippingTime={1000}
        usePortrait={false}
        startZIndex={0}
        autoSize={true}
        onFlip={(e) => setCurrentPage(e.data)}
      >
        {pages.map((pageUrl, index) => (
          <div 
            key={index}
            className={`page ${
              index === 0 ? 'first-page' : 
              index === pages.length - 1 ? 'last-page' : 
              index % 2 === 0 ? 'even-page' : 'odd-page'
            }`}
          >
            <div className="page-content">
              <img 
                src={pageUrl} 
                alt={`Page ${index + 1}`}
                className="page-image"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default Flipbook;