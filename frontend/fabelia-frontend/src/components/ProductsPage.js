import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from './UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faGlobe, faDownload, faTrash, faStar, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import TextModalWithPDF from './TextModalWithPDF';
import { useNavigate } from 'react-router-dom';

const ProductsPage = ({ setCurrentPdfUrl, setIsViewingPDF, setRenderedPages, setIsLoading }) => {
  const { currentUser } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTextModalOpen, setTextModalOpen] = useState(false);
  const [currentTextContent, setCurrentTextContent] = useState("");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const navigate = useNavigate();

  const handleCreateBook = () => {
    navigate('/skapa');
  };

  const openTextModal = async (textUrl, product) => {
    try {
      const response = await fetch(textUrl);
      if (!response.ok) {
        throw new Error('Kunde inte hämta textfil.');
      }
      const textContent = await response.text();
      setCurrentTextContent(textContent);
      setCurrentProduct(product);
      setTextModalOpen(true);
    } catch (error) {
      console.error('Error fetching text file:', error);
      alert('Ett fel inträffade vid hämtning av textfil.');
    }
  };

  const closeTextModal = () => {
    setTextModalOpen(false);
    setCurrentTextContent("");
  };

  const fetchProducts = async () => {
    if (!currentUser?.id) {
      console.error("Användar-ID saknas");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/user/stories?user_id=${currentUser.id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error('Kunde inte hämta produkter.');
      }

      const data = await response.json();
      const validatedProducts = data.stories.map((product) => {
        const validImageUrls = Array.isArray(product.insida_image_urls)
          ? product.insida_image_urls
          : JSON.parse(product.insida_image_urls || '[]');
        const omslagImageUrl = product.omslag_image_url && product.omslag_image_url.startsWith('http')
          ? product.omslag_image_url
          : "/images/default-cover.jpg";

        return {
          ...product,
          image_urls: validImageUrls,
          audio_url: product.audio_url && product.audio_url.startsWith('https://') ? product.audio_url : null,
          pdf_url: product.pdf_url && product.pdf_url.startsWith('https://') ? product.pdf_url : null,
          omslag_image_url: omslagImageUrl,
          isPublic: product.is_public
        };
      });

      setProducts(validatedProducts);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentUser]);

  const sanitizeTitle = (title) => {
    return title.replace(/_/g, ' ');
  };

  const togglePublic = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/toggle-public?product_id=${productId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Kunde inte uppdatera publiceringsstatus.');
      }

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? { ...product, isPublic: !product.isPublic } : product
        )
      );
    } catch (err) {
      console.error('Fel vid uppdatering av publiceringsstatus:', err);
      alert('Ett fel inträffade vid ändring av publiceringsstatusen.');
    }
  };

  const deleteProduct = async (productId) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:5000/delete-product/${productId}?user_id=${currentUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error('Kunde inte radera produkt.');
      }

      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
      alert('Produkten har raderats.');
    } catch (err) {
      console.error('Error deleting product:', err.message);
      alert('Ett fel inträffade vid radering av produkten.');
    }
  };

  const openDemoBook = (pdfUrl) => {
    if (typeof setCurrentPdfUrl === 'function') {
      setCurrentPdfUrl(pdfUrl);
      setIsViewingPDF(true);
    } else {
      console.error('setCurrentPdfUrl is not a function');
    }
  };

  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(products.length / itemsPerPage);

    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      if (startPage > 1) {
        pageNumbers.push(
          <span key="first" onClick={() => handlePageChange(1)} className="cursor-pointer mx-1 text-sm">1</span>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="first-ellipsis" className="mx-1 text-sm">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <span
            key={i}
            onClick={() => handlePageChange(i)}
            className={`cursor-pointer mx-1 text-sm ${
              currentPage === i ? 'font-bold text-blue-600' : 'text-gray-600'
            }`}
          >
            {i}
          </span>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="last-ellipsis" className="mx-1 text-sm">...</span>);
        }
        pageNumbers.push(
          <span key="last" onClick={() => handlePageChange(totalPages)} className="cursor-pointer mx-1 text-sm">{totalPages}</span>
        );
      }

      return pageNumbers;
    };

    return (
      <div className="flex justify-center items-center mt-4 text-sm">
        {currentPage > 1 && (
          <span
            onClick={() => handlePageChange(currentPage - 1)}
            className="cursor-pointer mr-2 text-gray-600"
          >
            &lt;
          </span>
        )}
        {renderPageNumbers()}
        {currentPage < totalPages && (
          <span
            onClick={() => handlePageChange(currentPage + 1)}
            className="cursor-pointer ml-2 text-gray-600"
          >
            &gt;
          </span>
        )}
      </div>
    );
  };

  return (
    <article className="w-full bg-gradient-to-b from-white to-warmWhite shadow rounded-lg p-6">
      <h1 className="text-5xl text-black text-center font-bold mb-4">Dina Böcker</h1>
      {loading && <p>Hämtar produkter...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <div className="bg-gray-50 p-6 rounded shadow text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hoppsan! 🌟</h2>
          <p className="text-gray-700 mb-6">
            Det verkar som att du inte har några böcker ännu. Men oroa dig inte, du kan skapa din första bok direkt!
          </p>
          <button
            onClick={handleCreateBook}
            className="bg-turquoise text-white px-6 py-3 rounded shadow-lg hover:bg-turquoise transform transition-transform hover:scale-105"
          >
            <span className="flex items-center justify-center space-x-2">
              <FontAwesomeIcon icon={faStar} className="text-softYellow" />
              <span>Skapa en bok</span>
            </span>
          </button>
        </div>
      )}
      {isTextModalOpen && currentProduct && (
        <TextModalWithPDF
          isOpen={isTextModalOpen}
          currentProduct={currentProduct}
          currentTextContent={currentTextContent}
          closeTextModal={closeTextModal}
        />
      )}
     {modalImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setModalImage(null)}  // Close modal when clicking outside
  >
    <div
      className="bg-white p-4 rounded-lg"
      onClick={(e) => e.stopPropagation()}  // Prevent click inside from closing modal
    >
      <img src={modalImage} alt="Förstorad bild" className="max-w-full" style={{ maxHeight: '70vh' }} />
      <button
        onClick={() => setModalImage(null)}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Stäng
      </button>
    </div>
  </div>
)}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className="border bg-white rounded-lg p-4 flex flex-col justify-between"
            style={{
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.06)",
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="flex-grow">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{sanitizeTitle(product.name)}</h2>
              </div>
              {product.omslag_image_url && (
                <div className="mb-4">
                  <img
                    src={product.omslag_image_url}
                    alt="Omslagsbild"
                    className="w-full h-auto object-cover rounded border border-gray-300 shadow-sm cursor-pointer"
                    style={{
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.4)",
                    }}
                    onClick={() => setModalImage(product.omslag_image_url)}
                  />
                </div>
              )}
              {product.summary && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800">Sammanfattning:</h3>
                  <p className="text-gray-600">{product.summary}</p>
                </div>
              )}
              {product.audio_url && (
                <div className="mb-4 w-full">
                  <audio controls className="w-full">
                    <source src={product.audio_url} type="audio/mpeg" />
                    Din webbläsare stödjer inte ljuduppspelning.
                  </audio>
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-2 mt-auto">
              {product.pdf_url && (
                <button
                  onClick={() => openDemoBook(product.pdf_url)}
                  className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
                  title="Öppna PDF"
                >
                  <FontAwesomeIcon icon={faBook} />
                </button>
              )}
              <button
                onClick={() => togglePublic(product.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors ${
                  product.isPublic ? 'bg-green-400 text-white' : 'bg-gray-300 text-black'
                }`}
                title={product.isPublic ? "Gör Privat" : "Gör Publik"}
              >
                <FontAwesomeIcon icon={faGlobe} />
              </button>
              {product.text_url && (
                <button
                  onClick={() => openTextModal(product.text_url, product)}
                  className="bg-lavenderPurple text-softYellow w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#8A49A1]"
                  title="Öppna Text"
                >
                  <FontAwesomeIcon icon={faFileAlt} />
                </button>
              )}
              {product.audio_url && (
                <a
                  href={product.audio_url}
                  download
                  className="bg-turquoise text-warmWhite w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#169E85]"
                  title="Ladda ner Ljudbok"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </a>
              )}
              <button
                onClick={() => deleteProduct(product.id)}
                className="bg-lightCoralPink text-warmWhite w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#E36496]"
                title="Radera"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </section>
      {renderPagination()}
    </article>
  );
};

export default ProductsPage;
