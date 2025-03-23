export const GrandparentsStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (data.grandparents.trim()) {
        onNext();
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Vad heter {data.childName}s far/mor-föräldrar?
        </h2>
        <div className="space-y-4">
          <label htmlFor="grandparents" className="block text-gray-700">
            Far/mor-föräldrar
          </label>
          <input
            id="grandparents"
            type="text"
            value={data.grandparents}
            onChange={(e) => onUpdate("grandparents", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Skriv far/mor-föräldrarnas namn..."
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Nästa
        </button>
      </form>
    );
  };