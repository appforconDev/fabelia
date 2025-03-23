import { useEffect } from "react"; // Importera useEffect

export const BasicInfoStep = ({ data, onUpdate, onNext }) => {
  // Logga när data uppdateras
  useEffect(() => {
    console.log("BasicInfoStep data updated:", data); // Debugging
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", data); // Debugging
    if (data.childName.trim() && data.childAge > 0 && data.gender) {
      onNext();
    } else {
      console.log("Form validation failed");
    }
  };

  console.log("BasicInfoStep data on render:", data); // Debugging

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Grundläggande information
      </h2>

      <div className="space-y-4">
        <label htmlFor="childName" className="block text-gray-700">
          Vad heter barnet?
        </label>
        <input
          id="childName"
          type="text"
          value={data.childName}
          onChange={(e) => onUpdate("childName", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv barnets namn"
          required
        />
      </div>

      <div className="space-y-4">
        <label htmlFor="childAge" className="block text-gray-700">
          Hur gammal är barnet?
        </label>
        <input
          id="childAge"
          type="number"
          min="0"
          max="18"
          value={data.childAge || ""}
          onChange={(e) => {
            onUpdate("childAge", Number(e.target.value));
            console.log("Child age updated:", Number(e.target.value)); // Debugging
          }}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="block text-gray-700">Barnets kön</label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.gender === "boy" ? "bg-blue-200 border-blue-500" : "bg-white border-gray-300"
            }`}
            onClick={() => {
              console.log("Clicked on Pojke"); // Debugging
              onUpdate("gender", "boy");
              console.log("Gender updated to boy", data); // Debugging
            }}
          >
            <h3 className="text-lg font-medium text-center">Pojke</h3>
            <p>Current class: {data.gender === "boy" ? "bg-red-200 " : "bg-white"}</p> {/* Debugging */}
          </div>
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-transform transform hover:scale-105 ${
              data.gender === "girl" ? "bg-pink-200 border-pink-500" : "bg-white border-gray-300"
            }`}
            onClick={() => {
              console.log("Clicked on Flicka"); // Debugging
              onUpdate("gender", "girl");
              console.log("Gender updated to girl", data); // Debugging
            }}
          >
            <h3 className="text-lg font-medium text-center">Flicka</h3>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={`w-full bg-red-200 text-white py-2 rounded-lg hover:bg-blue-600 ${
          data.childName.trim() && data.childAge > 0 && data.gender ? "" : "opacity-50 cursor-not-allowed"
        }`}
        disabled={!data.childName.trim() || data.childAge <= 0 || !data.gender}
      >
        Nästa
      </button>
    </form>
  );
};