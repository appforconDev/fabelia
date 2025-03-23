// pdfToImages.js
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`;

const pdfToImages = async (pdfUrl) => {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;

  const images = [];
  
  // A4 proportioner
  const a4Width = 595.28;
  const a4Height = 841.89;
  
  // Kvalitetsfaktor för bättre upplösning
  const quality = 2;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    
    // Beräkna skalan för att matcha A4 med kvalitetsfaktorn
    const scale = (a4Width / viewport.width) * quality;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Sätt canvas storlek till A4 * kvalitetsfaktor
    canvas.width = a4Width * quality;
    canvas.height = a4Height * quality;
    
    const renderContext = {
      canvasContext: context,
      viewport: page.getViewport({ scale }),
      background: 'white'
    };
    
    await page.render(renderContext).promise;
    
    // Konvertera till JPEG med hög kvalitet
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
    images.push(imageUrl);
  }

  return images;
};

export default pdfToImages;