import { Star, Sparkles } from "lucide-react";

const testimonials = [
  {
    quote: "Min dotter älskade sin personliga saga! Så enkelt och magiskt.",
    author: "Maria",
    role: "Mamma till Ella 5 år",
  },
  {
    quote: "Fantastiskt verktyg för att skapa unika berättelser med barnen.",
    author: "Anders",
    role: "Pappa till Lucas 7 år",
  },
  {
    quote: "Perfekt för godnattsagor! Barnen vill höra dem om och om igen.",
    author: "Sofia",
    role: "Mamma till Theo 4 år",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-warmWhite to-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-quicksand text-golden-900 mb-4">
            Våra användare 
          </h2>
          <p className="text-gray-600 font-open-sans max-w-2xl mx-auto">
             <span className="inline-flex items-center px-4 py-2 rounded-full bg-magic-200/50 text-magic-800 font-quicksand mb-4">
                             <Sparkles className="w-4 h-4 mr-2" />
                             Vad tycker andra föräldrar om Fabelia?
                           </span>
            
          </p>
        </div>

        
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-lg transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-softYellow fill-softYellow"
                  />
                ))}
              </div>
              <blockquote className="text-gray-600 font-open-sans text-center mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="text-center">
                <cite className="not-italic font-semibold font-quicksand text-golden-900">
                  {testimonial.author}
                </cite>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
};
export default TestimonialsSection;