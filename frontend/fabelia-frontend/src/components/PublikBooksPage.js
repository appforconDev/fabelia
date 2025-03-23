import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faFileAlt, faDownload, faGlobe } from '@fortawesome/free-solid-svg-icons';
import DemoBlock from "./Flipbook";

const sanitizeTitle = (title) => {
  return title.replace(/_/g, ' ');
};

const PublicBooksPage = () => {
  const [publicBooks, setPublicBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemoBookOpen, setDemoBookOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentTextContent, setCurrentTextContent] = useState("");
  const [isTextModalOpen, setTextModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchPublicBooks();
  }, []);

  const fetchPublicBooks = async () => {
    try {
      const response = await fetch('http://localhost:5000/public-books');
      if (!response.ok) {
        throw new Error('Kunde inte hämta publika böcker.');
      }
      const data = await response.json();
      const validatedBooks = data.books.map((book) => {
        const validImageUrls = Array.isArray(book.insida_image_urls)
          ? book.insida_image_urls
          : JSON.parse(book.insida_image_urls || '[]');

        const omslagImageUrl = book.omslag_image_url || (validImageUrls.length > 0 ? validImageUrls[0] : "/images/default-cover.jpg");

        return {
          ...book,
          image_urls: validImageUrls,
          audio_url: book.audio_url && book.audio_url.startsWith('https://') ? book.audio_url : null,
          omslag_image_url: omslagImageUrl,
          isPublic: book.is_public
        };
      });

      setPublicBooks(validatedBooks);
    } catch (err) {
      console.error('Fel vid hämtning av publika böcker:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDemoBook = (imageUrls) => {
    setCurrentPdfUrl(imageUrls);
    setDemoBookOpen(true);
  };

  const closeDemoBook = () => {
    setDemoBookOpen(false);
    setCurrentPdfUrl("");
  };

  const openTextModal = async (textUrl, book) => {
    try {
      const response = await fetch(textUrl);
      if (!response.ok) {
        throw new Error('Kunde inte hämta textfil.');
      }
      const textContent = await response.text();
      setCurrentTextContent(textContent);
      setCurrentBook(book);
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

  if (loading) return <p>Laddar publika böcker...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <article className="w-full bg-warmWhite shadow rounded-lg p-6">
      <h1 className="text-4xl text-center text-turquoise font-bold mb-4">Publika Böcker</h1>
      {publicBooks.length === 0 ? (
        <p>Inga publika böcker hittades.</p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicBooks.map((book) => (
            <div
              key={book.id}
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
                  <h2 className="text-xl font-semibold">{sanitizeTitle(book.name)}</h2>
                </div>
                {book.omslag_image_url && (
                  <div className="mb-4">
                    <img
                      src={book.omslag_image_url}
                      alt="Omslagsbild"
                      className="w-full h-auto object-cover rounded border border-gray-300 shadow-sm cursor-pointer"
                      style={{
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.4)",
                      }}
                      onClick={() => setModalImage(book.omslag_image_url)}
                    />
                  </div>
                )}
                {book.summary && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Sammanfattning:</h3>
                    <p className="text-gray-600">{book.summary}</p>
                  </div>
                )}
                {book.audio_url && (
                  <div className="mb-4 w-full">
                    <audio controls className="w-full">
                      <source src={book.audio_url} type="audio/mpeg" />
                      Din webbläsare stödjer inte ljuduppspelning.
                    </audio>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-2 mt-auto">
                {book.image_urls && book.image_urls.length > 0 && (
                  <button
                    onClick={() => openDemoBook(book.image_urls)}
                    className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
                    title="Öppna Bok"
                  >
                    <FontAwesomeIcon icon={faBook} />
                  </button>
                )}
                {book.text_url && (
                  <button
                    onClick={() => openTextModal(book.text_url, book)}
                    className="bg-lavenderPurple text-softYellow w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#8A49A1]"
                    title="Öppna Text"
                  >
                    <FontAwesomeIcon icon={faFileAlt} />
                  </button>
                )}
                {book.audio_url && (
                  <a
                    href={book.audio_url}
                    download
                    className="bg-turquoise text-warmWhite w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#169E85]"
                    title="Ladda ner Ljudbok"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {isTextModalOpen && currentBook && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 relative w-4/5 h-4/5 overflow-y-auto">
            <button
              className="absolute top-2 right-2 bg-red-500 text-white rounded px-2 py-1"
              onClick={closeTextModal}
            >
              Stäng
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">{sanitizeTitle(currentBook.name)}</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap break-words">
              {currentTextContent}
            </pre>
          </div>
        </div>
      )}

      {isDemoBookOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-3/4 h-3/4 p-4 relative">
            <button
              onClick={closeDemoBook}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
            >
              Stäng
            </button>
            <DemoBlock imageUrls={currentPdfUrl} />
          </div>
        </div>
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
    </article>
  );
};

export default PublicBooksPage;
