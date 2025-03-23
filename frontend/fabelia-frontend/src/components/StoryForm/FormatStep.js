import { FileText, BookOpen, AudioWaveform } from "lucide-react";

export const FormatStep = ({ data, onUpdate, onNext }) => {
  const options = [
    {
      value: "audiobook",
      label: "Ljudbok",
      icon: AudioWaveform,
      description: "Lyssna på din berättelse",
    },
    {
      value: "pdf",
      label: "PDF",
      icon: FileText,
      description: "Läs din berättelse",
    },
    {
      value: "both",
      label: "Både och",
      icon: BookOpen,
      description: "Både lyssna och läs",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Välj format för din berättelse
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <div
            key={option.value}
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.format === option.value ? "bg-green-200 border-green-500" : "bg-white border-gray-300"
            }`}
            onClick={() => {
              onUpdate("format", option.value);
              setTimeout(onNext, 300);
            }}
          >
            <option.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium text-center mb-2">
              {option.label}
            </h3>
            <p className="text-sm text-center text-gray-600">
              {option.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};