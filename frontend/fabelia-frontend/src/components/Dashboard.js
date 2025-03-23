import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from './UserContext';
import pdfToImages from './PDFViewer'; 
import PDFViewer from './PDFViewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faUser, faFileAlt, faDownload, faTrash, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { faStar, faDollarSign, faShoppingCart, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import visaLogo from '../assets/images/visa.png';
import mastercardLogo from '../assets/images/mastercard.webp';
import stripeLogo from '../assets/images/stripe.webp';
import FAQSection from './FAQSection';
import PublicBooksPage from './PublikBooksPage';
import TextModalWithPDF from './TextModalWithPDF';
import CreditModal from './CreditModal';
import AdminPromoCode from './AdminPromoCode';
import AffiliatePromoCode from './AffiliatePromoCode';
import StripeAccount from "./StripeAccount";
import Flipbook from './Flipbook';
import OrderForm from "./OrderForm";

const Dashboard = () => {
  const { currentUser, logout } = useContext(UserContext);
  const [activeSection, setActiveSection] = useState('konto');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // VIKTIGT: Nu visas max 5 produkter
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoBookOpen, setDemoBookOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [isTextModalOpen, setTextModalOpen] = useState(false);
  const [currentTextContent, setCurrentTextContent] = useState("");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isHowToModalOpen, setHowToModalOpen] = useState(false);
  const [isCreditModalOpen, setCreditModalOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const handleOpenCreditModal = () => setCreditModalOpen(true);
  const handleCloseCreditModal = () => setCreditModalOpen(false);
  const [loadedPages, setLoadedPages] = useState([]);
  const [renderedPages, setRenderedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingPDF, setIsViewingPDF] = useState(false); // Styr om vi visar PDF:n
  const pdfPath = "/Users/rickardwinbergh/Fabelia/backend/test_output.pdf"; // 🔥 Exempel-PDF
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);





  const handleCheckout = async (tier) => {
    try {
      const userId = currentUser?.id; // Användar-ID från databasen
      if (!userId) {
        console.error("Användar-ID saknas.");
        return;
      }

      const response = await fetch('http://localhost:5000/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          tier: Math.round(tier), // Säkerställ att tier är heltal
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; // Redirect till Stripe checkout
      } else {
        console.error('Ingen URL returnerades:', data);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

 
  const handlePageRender = (pageNum, imageUrl) => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[pageNum - 1] = imageUrl; // Lägg till den renderade sidan
      return newPages;
    });
  };
  

  const tiers = [
    { id: 1, credits: 500, price: 9.95, description: 'Perfekt för att skapa upp till 2 böcker.' },
    { id: 2, credits: 900, price: 14.95, description: 'Bra värde för aktiva skapare!' },
    { id: 3, credits: 1400, price: 19.95, description: 'Maximera dina besparingar för fler böcker.' },
  ];
  
  const stripePromise = loadStripe('din_stripe_publishable_key');
  const [selectedTier, setSelectedTier] = useState(null);
  
  const navigate = useNavigate();

  const togglePublic = async (productId) => {
    try {
      // Här anropar du en API-endpoint som ändrar isPublic för produkten.
      // Exempel: POST /toggle-public?product_id=...
      const response = await fetch(`http://localhost:5000/toggle-public?product_id=${productId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Kunde inte uppdatera publiceringsstatus.');
      }

      // Uppdatera produktlistan i state
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

  // Funktion för att sanera titeln
  const sanitizeTitle = (title) => {
    return title.replace(/_/g, ' ');
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Paginerade produkter
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Ny pagination-funktion
  const renderPagination = () => {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    // Om det finns färre än två sidor, rendera ingenting
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Justera startPage om vi är nära slutet
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      // Lägg till första sidan om den inte visas
      if (startPage > 1) {
        pageNumbers.push(
          <span key="first" onClick={() => handlePageChange(1)} className="cursor-pointer mx-1 text-sm">1</span>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="first-ellipsis" className="mx-1 text-sm">...</span>);
        }
      }

      // Lägg till sidnummer
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

      // Lägg till sista sidan om den inte visas
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
 

  const openDemoBook = (pdfUrl) => {
    setCurrentPdfUrl(pdfUrl);
    setSelectedPdfUrl(pdfUrl); 
    setIsViewingPDF(true); // Visa PDF-sektionen istället för en modal
  };
  

  const closeDemoBook = () => {
    setRenderedPages([]);
    setTimeout(() => {
      setDemoBookOpen(false);
    }, 100);
  };

  // Använd useEffect för att ladda PDF-filen när currentPdfUrl ändras
  useEffect(() => {
    if (!currentPdfUrl) return;

    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const images = await pdfToImages(currentPdfUrl);
        setRenderedPages(images);
      } catch (error) {
        console.error('Kunde inte ladda PDF:', error);
        alert('Något gick fel vid laddning av PDF.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [currentPdfUrl]);


  const openTextModal = async (textUrl, product) => {
    try {
        const response = await fetch(textUrl);
        if (!response.ok) {
            throw new Error('Kunde inte hämta textfil.');
        }
        const textContent = await response.text();
        setCurrentTextContent(textContent);
        setCurrentProduct(product); // Sätt den aktuella produkten
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

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === 'produkter') {
      fetchProducts();
    }
    if (section === 'create') {
      navigate('/create');
  }
  
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
          : "/images/default-cover.jpg";  // Fallback om omslagsbilden saknas
        
        return {
          ...product,
          image_urls: validImageUrls,
          audio_url: product.audio_url && product.audio_url.startsWith('https://') ? product.audio_url : null,
          pdf_url: product.pdf_url && product.pdf_url.startsWith('https://') ? product.pdf_url : null, // 🔥 Lägg till PDF-URL här
          omslag_image_url: omslagImageUrl,
          isPublic: product.is_public // Lägg till isPublic baserat på is_public från backend
        };
      });
  
      

      setProducts(validatedProducts);
      validatedProducts.forEach(product => {
        
      });
      


    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  
      
  const handlePrint = () => {
    const printArea = document.getElementById("print-area").innerHTML;
    const originalContent = document.body.innerHTML;
  
    document.body.innerHTML = printArea; // Visa endast print-area för utskrift
    window.print();
    document.body.innerHTML = originalContent; // Återställ sidan
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


  if (!currentUser) {
    return (
      <main className="w-full min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-lg text-neutral-700">
          Du måste vara inloggad för att se din dashboard.
        </p>
      </main>
    );
  }

  

  return (
    <section className="flex w-full min-h-screen overflow-hidden">
      <aside className="w-64 shrink-0 bg-neutral-800 text-white p-4 h-screen fixed top-xl" style={{ paddingTop: '70px' }}>
        <header className="text-2xl font-bold mb-6">Kontrollpanel</header>
        <nav className="space-y-2">
  <button
    onClick={() => handleSectionChange('konto')}
    className={`w-full text-left px-4 py-2 rounded ${
      activeSection === 'konto' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
    }`}
  >
    Konto
  </button>
  <button
    onClick={() => handleSectionChange('produkter')}
    className={`w-full text-left px-4 py-2 rounded ${
      activeSection === 'produkter' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
    }`}
  >
    Dina Böcker
  </button>
  <button
            onClick={handleOpenCreditModal}
            className="w-full text-left px-4 py-2 rounded hover:bg-neutral-700"
          >
            Fyll På&nbsp;
            <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
          </button>
  <button
    onClick={() => handleSectionChange('faq')}
    className={`w-full text-left px-4 py-2 rounded ${
      activeSection === 'faq' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
    }`}
  >
    FAQ
  </button>
  <button
    onClick={() => handleSectionChange('create')}
    className={`w-full text-left px-4 py-2 rounded ${
      activeSection === 'create' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
    }`}
  >
    Skapa Bok
  </button>
  <button
    onClick={() => handleSectionChange('publik')}
    className={`w-full text-left px-4 py-2 rounded ${
      activeSection === 'publik' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
    }`}
  >
    Publika Böcker
  </button>
  <button
      onClick={() => handleSectionChange('affiliate')}
      className={`w-full text-left px-4 py-2 rounded ${
        activeSection === 'affiliate' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
      }`}
    >
      Bli Affiliate
    </button>

  {/* Admin-knappen */}
  {currentUser.attributes?.email === 'uncnfrmd@gmail.com' && (
    <button
      onClick={() => handleSectionChange('admin')}
      className={`w-full text-left px-4 py-2 rounded ${
        activeSection === 'admin' ? 'bg-neutral-700' : 'hover:bg-neutral-700'
      }`}
    >
      Admin Promocodes
    </button>
  )}
</nav>

      </aside>

      <main className="ml-64 flex-1 w-full bg-neutral-100 p-6 overflow-auto">
      {activeSection === 'publik' && (
          <PublicBooksPage />
        )}
        {activeSection === 'affiliate' && (
          <AffiliatePromoCode />
        )}

{activeSection === 'konto' && (
  <article className="w-full bg-warmWhite shadow rounded-lg p-6">
    <h1 className="text-4xl font-bold mb-4 text-center text-turquoise">
      <FontAwesomeIcon icon={faUser} className="mr-2 text-softYellow" />
      Ditt Konto
    </h1>
    <section className="space-y-4 text-gray-800">
      <div className="flex justify-between">
        <span className="font-semibold">Namn:</span>
        <span>{currentUser.attributes?.given_name || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Email:</span>
        <span>{currentUser.attributes?.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Användarnamn:</span>
        <span>{currentUser.username|| "N/A"}</span>
      </div>
    </section>

    {/* Stripe-detaljer */}
    <StripeAccount currentUser={currentUser} />




    <div className="mt-6">
      <p className="text-gray-600 text-sm">
        Här kan du se din kontoinformation och lägga till dina Stripe-detaljer för att få utbetalningar. Om du behöver
        hjälp kan du öppna vår guide genom att klicka på knappen nedan.
      </p>
    </div>

    {/* Guide-knapp */}
    <div className="mt-6 flex justify-center space-x-4">
      <button
        onClick={() => setHowToModalOpen(true)}
        className="bg-lavenderPurple text-white px-6 py-2 rounded hover:bg-lavenderPurple transition-transform transform hover:scale-105"
      >
        Stripe Guide
      </button>
      
    </div>
  </article>
)}

<div
  className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
    isHowToModalOpen ? "" : "hidden"
  }`}
>
  <div className="bg-warmWhite w-[500px] rounded shadow-lg p-6 relative">
    {/* Stäng-knapp */}
    <button
      className="absolute top-2 right-2 bg-lavenderPurple text-white px-2 py-1 rounded hover:shadow-md transition-shadow duration-200"
      onClick={() => setHowToModalOpen(false)}
    >
      X
    </button>

    {/* Titel */}
    <h2 className="text-2xl font-bold mb-4 text-center text-turquoise">
      <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gold" />
      Hur lägger jag till Stripe?
    </h2>

    {/* Instruktioner */}
    <ol className="list-decimal list-inside space-y-4 text-gray-700">
      <li>
        Logga in på ditt{" "}
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Stripe-konto
        </a>
        .
      </li>
      <li>
        Gå till <strong>Inställningar</strong> och välj <strong>API</strong>-inställningar.
      </li>
      <li>
        Kopiera ditt <strong>Account ID</strong> som börjar med <code>acct_</code>.
      </li>
      <li>Klistra in ditt Account ID i fältet här på din kontosida.</li>
      <li>Klicka på <strong>Spara</strong> för att lagra dina detaljer.</li>
    </ol>

    {/* Bild/visualisering */}
    <div className="mt-6 flex justify-center">
      <img src={stripeLogo} alt="Stripe" className="h-6" title="Betalningar hanteras av Stripe" />
    </div>

    {/* Stäng-knapp */}
    <div className="mt-6 flex justify-end">
      <button
        onClick={() => setHowToModalOpen(false)}
        className="bg-turquoise text-white px-4 py-2 rounded hover:bg-turquoise transition-transform transform hover:scale-105"
      >
        Stäng
      </button>
    </div>
  </div>
</div>

       

{isTextModalOpen && currentProduct && (
  <TextModalWithPDF
    isOpen={isTextModalOpen}
    currentProduct={currentProduct}
    currentTextContent={currentTextContent}
    closeTextModal={closeTextModal}
  />
)}





        
        {activeSection === 'faq' && (
          <FAQSection />
        )}


{isViewingPDF ? (
  // 📖 Visar PDF-vyn istället för produktlistan
  <div className="w-full bg-warmWhite shadow rounded-lg p-6">
    {/* Rad med tillbaka-knappen och rubriken centrerad */}
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => setIsViewingPDF(false)} // Gå tillbaka till produktlistan
        className="bg-turquoise text-white px-6 py-3 rounded shadow-lg hover:bg-turquoise transform transition-transform hover:scale-105"
      >
        ← Tillbaka
      </button>
      <h1 className="text-4xl font-bold mb-4 text-center text-turquoise flex-grow">
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

    {/* 🔥 Information om att beställa boken fysiskt */}
    <div className="mt-8 p-6 bg-gray-100 rounded shadow">
      <h2 className="text-xl font-semibold text-gray-800">Beställ en fysisk bok</h2>
      <p className="text-gray-700 mt-2">
        Vill du ha din bok i tryckt format? Fyll i formuläret nedan så kontaktar vi dig med mer information.
        Priset varierar beroende på sidantal och tryckkvalitet.
      </p>

      {/* 📬 Beställningsformulär */}
    <OrderForm pdfUrl={selectedPdfUrl} />

    </div>
  </div>
) : (
  // 🏆 Här visas produktlistan om vi INTE är i PDF-vyn
  activeSection === 'produkter' && (
    <article className="w-full bg-warmWhite shadow rounded-lg p-6">
      <h1 className="text-4xl text-turquoise text-center font-bold mb-4">Dina Böcker</h1>
      {loading && <p>Hämtar produkter...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <div className="bg-gray-50 p-6 rounded shadow text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hoppsan! 🌟</h2>
          <p className="text-gray-700 mb-6">
            Det verkar som att du inte har några böcker ännu. Men oroa dig inte, du kan skapa din första bok direkt!
          </p>
          <button
            onClick={() => handleSectionChange('create')} 
            className="bg-turquoise text-white px-6 py-3 rounded shadow-lg hover:bg-turquoise transform transition-transform hover:scale-105"
          >
            <span className="flex items-center justify-center space-x-2">
              <FontAwesomeIcon icon={faStar} className="text-softYellow" />
              <span>Skapa en bok</span>
            </span>
          </button>
        </div>
      )}
      <section className="space-y-4">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className="border bg-white rounded-lg p-4 flex justify-between items-start"
            style={{
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* Kolumn 1: Titel, knappar och ljudspelare */}
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{sanitizeTitle(product.name)}</h2>
                <div className="flex space-x-2">
                  {/* Knapp för att öppna PDF-vy */}
                  {product.pdf_url && (
                    <button
                      onClick={() => openDemoBook(product.pdf_url)}
                      className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
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
              {product.summary && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800">Sammanfattning:</h3>
                  <p className="text-gray-600">{product.summary}</p>
                </div>
              )}
              {product.audio_url && (
                <div className="mt-4">
                  <audio controls className="w-full">
                    <source src={product.audio_url} type="audio/mpeg" />
                    Din webbläsare stödjer inte ljuduppspelning.
                  </audio>
                </div>
              )}
            </div>
            {/* Kolumn 2: Omslagsbild */}
            {product.omslag_image_url && (
              <div className="ml-4 flex-shrink-0">
                <img
                  src={product.omslag_image_url}
                  alt="Omslagsbild"
                  className="w-[200px] h-[200px] object-cover rounded border border-gray-300 shadow-sm cursor-pointer"
                  style={{
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.4)",
                  }}
                  onClick={() => setModalImage(product.omslag_image_url)}
                />
              </div>
            )}
          </div>
        ))}
      </section>
      {renderPagination()}
    </article>
  )
)}





{activeSection === 'admin' && (
  <article className="w-full bg-warmWhite shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold mb-4 text-center text-turquoise">
      Hantera Rabattkoder
    </h1>
    <AdminPromoCode />
  </article>
)}



{/* CreditModal */}
<CreditModal
        isOpen={isCreditModalOpen}
        onClose={handleCloseCreditModal}
        onCheckout={handleCheckout}
      />

          </main>
          {/* DemoBook Modal */}
          {isDemoBookOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-3/4 h-3/4 p-4 relative overflow-hidden">
            <button
              onClick={closeDemoBook}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
            >
              Stäng
            </button>
            {isLoading ? (
              <div>Laddar PDF...</div>
            ) : (
              <Flipbook pages={renderedPages} />
            )}
          </div>
        </div>
    )}


          </section>

                  );
                  };

export default Dashboard;