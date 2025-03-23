
import Kategorier from './Kategorier';
import FeaturesSection from './Features_home';
import CtaSection from './CTA';
import DemoBook from './DemoBok';
import BlaHome from './Bla_home';
import TestimonialsSection from './Testimonials';
import '../App.css';
import { BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { StoryForm } from "./StoryForm/StoryForm";
import React, { useState } from 'react';

const Home = () => {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return <StoryForm />;
  }
  return (
    <div className="bg-warmWhite min-h-screen mt-[-80px]">
      {/* Hero Section med bakgrundsbild */}
      <div 
        className="relative bg-cover bg-center h-[900px]" 
        style={{ backgroundImage: 'url(/images/epicbg.jpg)' }}
      >
        <section className="flex flex-col justify-center items-center text-center px-4 bg-black bg-opacity-50 h-full">
          <div className="max-w-4xl mx-auto space-y-8 text-white">
            <div className="animate-fade-up">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-magic-200/50 text-magic-800 font-quicksand mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Magiska berättelser med AI
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-quicksand leading-tight mb-4">
                Skapa din egen magiska ljudbok på bara några minuter!
                
              </h1>
              <p className="text-lg md:text-xl font-open-sans max-w-2xl mx-auto">
                Fabelia öppnar dörren till en värld av magi och äventyr där ditt barn är huvudpersonen! 
                Med hjälp av avancerad AI-teknik skapar du unika ljudböcker och sagor fyllda med deras drömmar och fantasier.
              </p>
            </div>
            
            <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          
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

      {/* Categories Section */}
      <Kategorier />
      <BlaHome />
      <FeaturesSection />
      
      <DemoBook />
      <CtaSection />
      <TestimonialsSection />
      
    </div>
  );
};

export default Home;
