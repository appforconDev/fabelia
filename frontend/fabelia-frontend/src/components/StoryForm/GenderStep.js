import { Button } from "@/components/ui/button";

export const GenderStep = ({ data, onUpdate, onNext }) => {
  const handleSelect = (gender) => {
    onUpdate("gender", gender);
    setTimeout(onNext, 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Välj kön för {data.childName}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
            data.gender === "boy" ? "bg-blue-200 border-blue-500" : "bg-white border-gray-300"
          }`}
          onClick={() => handleSelect("boy")}
        >
          <h3 className="text-lg font-medium text-center">Pojke</h3>
        </div>
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
            data.gender === "girl" ? "bg-pink-200 border-pink-500" : "bg-white border-gray-300"
          }`}
          onClick={() => handleSelect("girl")}
        >
          <h3 className="text-lg font-medium text-center">Flicka</h3>
        </div>
      </div>
    </div>
  );
};