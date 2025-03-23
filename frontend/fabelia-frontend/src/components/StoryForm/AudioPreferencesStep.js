import { Clock } from "lucide-react";

export const AudioPreferencesStep = ({ data, onUpdate, onNext }) => {
  const handleSelectDuration = (duration) => {
    const creditsMapping = {
      5000: 200,
      9000: 400,
      14000: 600,
    };

    const credits = creditsMapping[duration];
    onUpdate("duration", duration);
    onUpdate("credits", credits); // Uppdatera credits baserat på vald längd
  };

  const handleSelectNarrator = (narrator) => {
    onUpdate("narrator", narrator);
  };

  const handleNext = () => {
    if (data.duration && data.narrator) {
      onNext(); // Gå vidare till nästa steg endast om både längd och uppläsare är valda
    }
  };

  const durationOptions = [
    { value: 5000, label: "10 minuter", credits: 200 },
    { value: 9000, label: "20 minuter", credits: 400 },
    { value: 14000, label: "30 minuter", credits: 600 },
  ];

  return (
    <div className="space-y-12 animate-fadeIn p-4">
      
        <div>
          <h2 className="text-2xl font-semibold text-center mb-8">
            Välj längd för ljudboken
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {durationOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
                  data.duration === option.value
                    ? "bg-turquoise border-gray"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => handleSelectDuration(option.value)}
              >
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-medium text-center">{option.label}</h3>
              </div>
            ))}
          </div>
        </div>
      

      <div>
        <h2 className="text-2xl font-semibold text-center mb-8">
          Välj en uppläsare
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.narrator === "male"
                ? "bg-blue-200 border-blue-400"
                : "bg-white border-gray-300"
            }`}
            onClick={() => handleSelectNarrator("male")}
          >
            <h3 className="text-lg font-medium text-center">Manlig</h3>
          </div>
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.narrator === "female"
                ? "bg-pink-200 border-pink-400"
                : "bg-white border-gray-300"
            }`}
            onClick={() => handleSelectNarrator("female")}
          >
            <h3 className="text-lg font-medium text-center">Kvinnlig</h3>
          </div>
        </div>
      </div>

      {/* Nästa-knapp */}
      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!data.duration || !data.narrator} // Inaktivera knappen om längd eller uppläsare saknas
          className={`w-full md:w-1/2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 ${
            !data.duration || !data.narrator ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Nästa
        </button>
      </div>
    </div>
  );
};