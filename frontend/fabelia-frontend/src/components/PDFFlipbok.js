import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import Flipbook from './Flipbook';

const PDFFlipbook = ({ pdfUrl }) => {
  const [pages, setPages] = useState([]);

  const handlePageRender = (pageNum, imageUrl) => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[pageNum - 1] = imageUrl; // Lägg till den renderade sidan
      return newPages;
    });
  };

  return (
    <div>
      <PDFViewer pdfUrl={pdfUrl} onPageRender={handlePageRender} />
      <Flipbook pages={pages.filter(Boolean)} /> {/* Skicka bara renderade sidor */}
    </div>
  );
};

export default PDFFlipbook;