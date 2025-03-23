import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faDownload } from '@fortawesome/free-solid-svg-icons';
import DemoBlock from './Flipbook';
import { Sparkles } from "lucide-react";
import omslag from "../assets/images/fabelia_omslag.webp";

const demoBook = {
  id: "demo-book",
  name: "Fabelias Första Äventyr",
  summary: "En magisk berättelse där ditt barn blir hjälten i sitt eget äventyr.",
  omslag_image_url: omslag,
  audio_url: "/audio/demo-book.mp3",
  image_urls: ["/images/demo-page1.jpg", "/images/demo-page2.jpg", "/images/demo-page3.jpg"],
};

const DemoBook = () => {
  const [isDemoBookOpen, setDemoBookOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  return (
    <section className="w-full bg-warmWhite shadow rounded-lg p-6">
  <h2 className="text-3xl md:text-4xl text-center text-black font-bold mb-6">
    Lyssna på vår egna bok
  </h2>
  <div className="text-center px-4">
    <span className="inline-flex items-center px-4 py-2 rounded-full text-magic-800 font-quicksand mb-4 text-sm md:text-base">
      <Sparkles className="w-4 h-4 mr-2" />
      Så här kommer dina böcker att se ut! När du skapar en bok blir den tillgänglig för nedladdning direkt i din personliga kontrollpanel.
    </span>
  </div>

  <div className="center-container">
    <div
      className="border bg-white rounded-lg p-4 flex flex-col justify-between responsive-card"
      style={{
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.06)",
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex-grow">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{demoBook.name}</h2>
        </div>
        {demoBook.omslag_image_url && (
          <div className="mb-4">
            <img
              src={demoBook.omslag_image_url}
              alt="Omslagsbild"
              className="w-full h-auto object-cover rounded border border-gray-300 shadow-sm cursor-pointer"
              style={{
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.4)",
              }}
              onClick={() => setModalImage(demoBook.omslag_image_url)}
            />
          </div>
        )}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Sammanfattning:</h3>
          <p className="text-gray-600">{demoBook.summary}</p>
        </div>
        {demoBook.audio_url && (
          <div className="mb-4 w-full">
            <audio controls className="w-full">
              <source src={demoBook.audio_url} type="audio/mpeg" />
              Din webbläsare stödjer inte ljuduppspelning.
            </audio>
          </div>
        )}
      </div>
      <div className="flex justify-center space-x-2 mt-auto">
        {demoBook.image_urls.length > 0 && (
          <button
            onClick={() => setDemoBookOpen(true)}
            className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
            title="Öppna Bok"
          >
            <FontAwesomeIcon icon={faBook} />
          </button>
        )}
        {demoBook.audio_url && (
          <a
            href={demoBook.audio_url}
            download
            className="bg-turquoise text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#169E85]"
            title="Ladda ner Ljudbok"
          >
            <FontAwesomeIcon icon={faDownload} />
          </a>
        )}
      </div>
    </div>
  </div>

  {isDemoBookOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-3/4 h-3/4 p-4 relative">
        <button
          onClick={() => setDemoBookOpen(false)}
          className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
        >
          Stäng
        </button>
        <DemoBlock imageUrls={demoBook.image_urls} />
      </div>
    </div>
  )}

  {modalImage && (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={() => setModalImage(null)}
    >
      <div
        className="bg-white rounded shadow-lg p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={modalImage}
          alt="Omslagsbild - Förstorad"
          className="max-w-full max-h-[80vh] rounded"
        />
        <button
          className="absolute top-2 right-2 text-white bg-[#282c34] hover:scale-110 transition-transform duration-300 rounded-full px-2 py-1"
          onClick={() => setModalImage(null)}
        >
          Stäng
        </button>
      </div>
    </div>
  )}
</section>

  );
};

export default DemoBook;
