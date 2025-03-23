import { Clock } from "lucide-react";

export const DurationStep = ({ data, onUpdate, onNext }) => {
  const handleSelect = (duration) => {
    onUpdate("duration", duration);
    setTimeout(onNext, 300);
  };

  const options = [
    { value: "10", label: "10 minuter" },
    { value: "20", label: "20 minuter" },
    { value: "30", label: "30 minuter" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Välj längd för ljudboken
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <div
            key={option.value}
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.duration === option.value ? "bg-yellow-200 border-yellow-500" : "bg-white border-gray-300"
            }`}
            onClick={() => handleSelect(option.value)}
          >
            <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium text-center">{option.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}; 