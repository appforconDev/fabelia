import React from 'react';
import { Link } from 'react-router-dom';
import image5 from '../assets/images/5.jpg';
import image6 from '../assets/images/6.jpg';
import image7 from '../assets/images/7.jpg';

const Kategorier = () => {
  const categories = [
    {
      key: "valj_hjalte",
      image: image5,
      title: "Välj en hjälte",
      description: "Skapa en huvudperson som liknar ditt barn. Välj namn, utseende och personlighetsegenskaper för att göra sagan ännu mer personlig och magisk. Låt barnet vara hjälten i sitt eget äventyr!",
    },
    {
      key: "skriv_aventyr",
      image: image6,
      title: "Skriv in ett äventyr",
      description: "Berätta vilken typ av saga du vill skapa. Ska det vara ett episkt rymdäventyr, en spännande skattjakt eller en magisk resa genom en förtrollad skog? Anpassa berättelsen genom att välja miljö, teman och speciella vändpunkter.",
    },
    {
      key: "lyssna_las",
      image: image7,
      title: "Lyssna & Läs",
      description: "Njut av din personliga saga med ljud och bilder. Lyssna på en AI-berättarröst som ger liv åt berättelsen, medan unika illustrationer följer med i sagan. Dela sagan med familj och vänner eller skriv ut den som en bok.",
    },
  ];

  return (
    <section id="kategorier" className="p-8 relative -mt-32 z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {categories.map((category) => (
          <div
            key={category.key}
            className="bg-gradient-to-b from-white to-white cursor-pointer rounded-lg p-4 hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <div className="rounded-lg p-4 text-center">
              <div className="w-full mb-4">
                <img src={category.image} alt={category.title} className="w-full h-auto object-cover rounded-lg" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">{category.title}</h3>
              <p className="text-gray-700">{category.description}</p>
              {category.key === 'skapa_bok' && (
                <div className="text-center mt-4">
                  {/* Additional content if needed */}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Kategorier;
