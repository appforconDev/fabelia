import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const FAQSection = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "Hur fungerar stjärnor?",
      answer:
        "Stjärnor är Fabelias virtuella valuta som används för att skapa personliga ljudböcker och illustrationer. Varje skapandeprocess har en stjärnkostnad baserad på dess omfattning och funktioner. Du kan enkelt köpa fler stjärnor via vår plattform, och dina återstående stjärnor sparas på ditt konto för framtida användning.",
    },
    {
      id: 2,
      question: "Hur betalar jag för stjärnor?",
      answer:
        "Betalningar hanteras säkert via Stripe, en betrodd betalningstjänst som används av miljontals företag globalt. Vi accepterar Visa, Mastercard och andra stora kreditkort. För din säkerhet lagrar vi inga kortuppgifter, och all betalningsinformation hanteras direkt av Stripe.",
    },
    {
      id: 3,
      question: "Kan jag dela mina böcker med andra?",
      answer:
        "Ja, du kan dela dina böcker genom att göra dem publika i dina produkter. När du ställer in en bok som publik blir den synlig för andra användare på plattformen. Du har full kontroll över vilka böcker du vill dela, och du kan när som helst ändra en boks status tillbaka till privat.",
    },
    {
      id: 4,
      question: "Vilka språk stöds?",
      answer:
        "För närvarande stöder vi svenska och engelska för både textgenerering och ljudböcker. Vi planerar att lägga till fler språk i framtiden för att ge en ännu mer anpassad upplevelse. Om du har önskemål om nya språk, kontakta gärna vårt supportteam.",
    },
    {
      id: 5,
      question: "Hur kontaktar jag support?",
      answer:
        "Om du behöver hjälp, kan du kontakta oss via e-post på support@fabelia.se. Vårt supportteam är här för att hjälpa dig med alla frågor eller problem. Vi strävar efter att svara på alla förfrågningar inom 24 timmar på vardagar.",
    },
    {
      id: 6,
      question: "Hur hanteras mina uppgifter?",
      answer:
        "Vi tar din integritet på största allvar. Dina personliga uppgifter används endast för att skapa och hantera dina böcker och sparas säkert i våra system. Vi delar aldrig dina data med tredje part utan ditt medgivande. För mer information kan du läsa vår integritetspolicy.",
    },
    {
      id: 7,
      question: "Kan jag ändra eller ta bort mina böcker?",
      answer:
        "Ja, du kan redigera eller ta bort böcker du har skapat via din kontrollpanel. Det ger dig full kontroll över innehållet och statusen för dina böcker.",
    },
    {
      id: 8,
      question: "Vad gör jag om något går fel med en betalning?",
      answer:
        "Om du stöter på problem med en betalning, kontakta oss omedelbart via support@fabelia.se. Vårt team kommer att hjälpa dig att lösa problemet så snabbt som möjligt.",
    },
    {
      id: 9,
      question: "Hur säkerställs kvaliteten på mina ljudböcker?",
      answer:
        "Vi använder toppmodern AI-teknik för att säkerställa högsta kvalitet på både text och ljud. Om du stöter på några problem eller har feedback, vänligen kontakta vårt supportteam så vi kan förbättra din upplevelse.",
    },
    {
      id: 10,
      question: "Hur fungerar affiliate-programmet?",
      answer:
        "Som affiliate skapar du personlig rabattkoder som du kan dela med ditt nätverk, på sociala medier eller via din blogg. Varje gång någon använder din kod för att köpa krediter på vår plattform får du en ersättning. Ersättningen varierar beroende på den rabattprocent som används och vilket paket kunden köper. Du kan följa dina intäkter och begära utbetalningar direkt i Affiliate sektionen.",
    },
    
  ];
  
  

  const toggleQuestion = (id) => {
    setActiveQuestion(activeQuestion === id ? null : id);
  };

  return (
    <section className="w-full bg-warmWhite p-6 rounded-lg shadow-lg">
      <h2 className="text-4xl font-bold text-turquoise text-center mb-6">
        Vanliga Frågor
      </h2>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="border border-gray-300 rounded-lg p-4 bg-gray-100"
          >
            <button
              onClick={() => toggleQuestion(faq.id)}
              className="flex justify-between items-center w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
              <FontAwesomeIcon
                icon={activeQuestion === faq.id ? faChevronUp : faChevronDown}
                className="text-turquoise"
              />
            </button>
            {activeQuestion === faq.id && (
              <p className="mt-2 text-gray-600">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
