export const NarratorStep = ({ data, onUpdate, onNext }) => {
    const handleSelect = (narrator) => {
      onUpdate("narrator", narrator);
      setTimeout(onNext, 300);
    };
  
    return (
      <div className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Välj en uppläsare
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.narrator === "male" ? "bg-blue-200 border-blue-500" : "bg-white border-gray-300"
            }`}
            onClick={() => handleSelect("male")}
          >
            <h3 className="text-lg font-medium text-center">Manlig röst</h3>
          </div>
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.narrator === "female" ? "bg-pink-200 border-pink-500" : "bg-white border-gray-300"
            }`}
            onClick={() => handleSelect("female")}
          >
            <h3 className="text-lg font-medium text-center">Kvinnlig röst</h3>
          </div>
        </div>
      </div>
    );
  };