import React from "react";
import { jsPDF } from "jspdf";

const TextModalWithPDF = ({ isOpen, currentProduct, currentTextContent, closeTextModal }) => {
  const sanitizeTitle = (title) => {
    return title.replace(/_/g, " ");
  };

  const handlePrint = () => {
    const sanitizedTitle = sanitizeTitle(currentProduct.name);
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;

    // Lägg till titel
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text(sanitizedTitle, margin, margin + 10);

    // Lägg till text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const textLines = doc.splitTextToSize(currentTextContent, pageWidth - margin * 2);
    let cursorY = margin + 20;

    textLines.forEach((line) => {
      if (cursorY + 10 > pageHeight - margin) {
        // Om vi når botten av sidan, lägg till en ny sida
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += 10; // Flytta ner för nästa rad
    });

    // Öppna PDF i ny flik och visa utskriftsdialog
    const pdfUrl = doc.output("bloburl");
    const newWindow = window.open(pdfUrl, "_blank");
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.print();
      };
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-warmWhite rounded-lg shadow-lg p-6 relative w-4/5 h-4/5">
          {/* Stängningsknapp */}
          <button
            className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-transform transform hover:scale-105"
            onClick={closeTextModal}
          >
            Stäng
          </button>

          {/* Titel */}
          <h2 className="text-2xl font-bold mb-4 text-center text-turquoise">
            {sanitizeTitle(currentProduct.name)}
          </h2>

          {/* Innehåll */}
          <div
            className="text-lg font-medium text-gray-800 bg-gray-100 p-6 rounded shadow-inner overflow-auto whitespace-pre-wrap"
            style={{
              lineHeight: "1.8",
              fontFamily: "'Roboto', sans-serif",
              maxHeight: "60vh",
            }}
          >
            {currentTextContent}
          </div>

          {/* Utskriftsknapp */}
          <div className="text-center mt-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-transform transform hover:scale-105"
              onClick={handlePrint}
            >
              Skriv ut
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default TextModalWithPDF;
