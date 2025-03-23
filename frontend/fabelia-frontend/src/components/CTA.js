import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const CtaSection = () => {
  return (
    <section className="py-20 bg-warmWhite">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold font-quicksand text-magic-900 mb-6">
              Redo att skapa din egen saga?
            </h2>
            <p className="text-lg text-gray-600 font-open-sans mb-8">
              Börja din magiska resa med Fabelia idag och skapa oförglömliga minnen med ditt barn
            </p>
            <Link to="/create" className="bg-turquoise hover:bg-turquoise w-4/5 sm:w-2/5 text-white font-semibold px-8 py-4 rounded-full transform transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto">
  <Sparkles className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
  Skapa din första bok !
</Link>
          </div>
        </div>
      </div>
    </section>  
  );
};
export default CtaSection;