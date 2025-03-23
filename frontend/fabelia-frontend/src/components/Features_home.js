import React from 'react';
import image1 from '../assets/images/1.jpg';
import image2 from '../assets/images/2.jpg';
import image3 from '../assets/images/3.jpg';
import image4 from '../assets/images/4.jpg';
import { Sparkles } from "lucide-react";

const features = [
  {
    image: image1,
    title: "Personliga berättelser",
    description: "Varje bok är unik, baserad på barnets idéer och önskemål.",
  },
  {
    image: image2,
    title: "AI-berättarröst",
    description: "Professionell röstsyntes skapar en levande och engagerande berättelse.",
  },
  {
    image: image3,
    title: "Magiska illustrationer",
    description: "Vackra bilder som passar perfekt till varje saga.",
  },
  {
    image: image4,
    title: "Trygghet & Kvalitet",
    description: "Säkert innehåll skapat med noggrant utvalda AI-modeller.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-warmWhite to-warmWhite">
      <div className="container mx-auto px-4 flex flex-col items-center">
        {/* Centered Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-magic-900">
            Magiska funktioner
          </h2>
          <p className="text-lg text-gray-600">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-magic-200/50 text-magic-800 font-quicksand mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Upptäck allt du kan göra med Fabelia för att skapa underbara berättelser.
            </span>
          </p>
        </div>

        {/* 2x2 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-white to-white rounded-xl border border-gray-100 shadow-md hover:shadow-md transition-all duration-300"
            >
              {/* Image */}
              <div className="w-full mb-4">
                <img src={feature.image} alt={feature.title} className="w-full h-auto object-cover rounded-lg" />
              </div>

              {/* Title and Description */}
              <h3 className="text-xl font-semibold text-magic-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
