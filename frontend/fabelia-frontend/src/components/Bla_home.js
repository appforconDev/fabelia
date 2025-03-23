import { StoryForm } from "./StoryForm/StoryForm";
import React, { useState } from 'react';
import { Sparkles, BookOpen, Mic, Image, Shield } from "lucide-react";
import image8 from '../assets/images/8.jpg'; // Importera bilderna
import image9 from '../assets/images/9.jpg';

const features = [
  {
    icon: <BookOpen className="w-8 h-8 text-lavenderPurple" />,
    title: "Personliga berättelser",
    description: "Varje bok är unik, baserad på barnets idéer och önskemål.",
  },
  {
    icon: <Mic className="w-8 h-8 text-turquoise" />,
    title: "AI-berättarröst",
    description: "Professionell röstsyntes skapar en levande och engagerande berättelse.",
  },
  {
    icon: <Image className="w-8 h-8 text-softYellow" />,
    title: "Magiska illustrationer",
    description: "Vackra bilder som passar perfekt till varje saga.",
  },
  {
    icon: <Shield className="w-8 h-8 text-lightCoralPink" />,
    title: "Trygghet & Kvalitet",
    description: "Säkert innehåll skapat med noggrant utvalda AI-modeller.",
  },
];

const BlaHome = () => {
    const [showForm, setShowForm] = useState(false);
    
      if (showForm) {
        return <StoryForm />;
      }
  return (
    <div>
      {/* Huvudsektion: Skapa Magiska Berättelser för Ditt Barn */}
      <section className="py-20 bg-gradient-to-b from-warmWhite to-warmWhite">
  <div className="container mx-auto px-4 flex flex-col items-center">
    {/* Rubrik */}
    <h1 className="text-4xl md:text-5xl font-bold text-magic-900 mb-6 text-center">
      Skapa Magiska Berättelser för Ditt Barn
    </h1>

    {/* Beskrivande text */}
    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 text-center">
      Föreställ dig glädjen i ditt barns ögon när de hör en berättelse där de är hjälten, deras bästa vänner är med på äventyret och välkända platser från deras vardag får liv i historien.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Första kortet med bild och text */}
          <div className="text-center bg-white rounded-xl border border-gray-100 shadow-md">
            {/* Bild */}
            <div className="w-full mb-4">
              <img src={image8} alt="Studier visar" className="w-full h-auto object-cover rounded-t-lg" />
            </div>
            {/* Text */}
            <div className="p-6">
              <p className="text-lg text-gray-600 mb-4">
                Studier visar att barn blir mer engagerade när de ser sig själva i en berättelse. Att höra sitt namn i en saga stärker självförtroendet, gör läsningen roligare och skapar en starkare koppling mellan berättaren och lyssnaren.
              </p>
            </div>
          </div>

          {/* Andra kortet med bild och text */}
          <div className="text-center bg-white rounded-xl border border-gray-100 shadow-md">
            {/* Bild */}
            <div className="w-full mb-4">
              <img src={image9} alt="Oavsett äventyr" className="w-full h-auto object-cover rounded-t-lg" />
            </div>
            {/* Text */}
            <div className="p-6">
              <p className="text-lg text-gray-600 mb-4">
                Oavsett om det handlar om riddare och drakar, rymdäventyrare på nya planeter eller en mysig godnattsaga om vänskap, är dessa böcker skapade för att få varje barn att känna sig speciell.
              </p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 flex flex-col items-center">
  {/* Knapp */}
  <button
                  className="bg-turquoise hover:bg-turquoise w-4/5 sm:w2/5 text-white font-semibold px-8 py-4 rounded-full transform transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
                  onClick={() => setShowForm(true)}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Skapa din första bok nu!
                </button>

        </div>
  </div>
</section>

    

    </div>
  );
};

export default BlaHome;