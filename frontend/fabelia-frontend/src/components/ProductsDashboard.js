import React, { useState, useEffect } from 'react';
import ProductsPage from './ProductsPage';
import pdfToImages from './PDFViewer';
import Flipbook from './Flipbook';
import OrderForm from "./OrderForm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const ProductsDashboard = () => {
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [renderedPages, setRenderedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingPDF, setIsViewingPDF] = useState(false);

  useEffect(() => {
    if (!currentPdfUrl) return;

    let isMounted = true; // Track if the component is still mounted

    const fetchPages = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching PDF pages for:', currentPdfUrl);
        const images = await pdfToImages(currentPdfUrl);
        if (isMounted) {
          setRenderedPages(images);
        }
      } catch (error) {
        console.error('Kunde inte ladda PDF:', error);
        alert('Något gick fel vid laddning av PDF.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPages();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [currentPdfUrl]);

  return (
    <div>
      {isViewingPDF ? (
        <div className="w-full bg-warmWhite shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <button
              onClick={() => setIsViewingPDF(false)}
              className="bg-turquoise text-white px-4 py-2 md:px-6 md:py-3 rounded shadow-lg hover:bg-turquoise transform transition-transform hover:scale-105 mb-4 md:mb-0"
            >
              ← Tillbaka
            </button>
            <h1 className="text-2xl md:text-4xl font-bold text-center text-turquoise flex-grow">
              <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
              &nbsp; Äventyret väntar - Bläddra och Beställ &nbsp;
              <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-softYellow" />
            </h1>
          </div>

          {isLoading ? (
            <p className="text-gray-600 text-center">Laddar PDF...</p>
          ) : (
            <Flipbook pages={renderedPages} />
          )}

          <div className="mt-8 p-4 md:p-6 bg-gray-100 rounded shadow">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Beställ en fysisk bok
            </h2>
            <p className="text-sm md:text-base text-gray-700 mt-2">
              Vill du ha din bok i tryckt format? Fyll i formuläret nedan så kontaktar vi dig med mer information.
              Priset varierar beroende på sidantal och tryckkvalitet.
            </p>
            <OrderForm pdfUrl={currentPdfUrl} />
          </div>
        </div>
      ) : (
        <ProductsPage
          setCurrentPdfUrl={setCurrentPdfUrl}
          setIsViewingPDF={setIsViewingPDF}
          setRenderedPages={setRenderedPages}
          setIsLoading={setIsLoading}
        />
      )}
    </div>
  );
};

export default ProductsDashboard;
