export const CityStep = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.city.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        I vilken stad bor {data.childName}?
      </h2>
      <div className="space-y-4">
        <label htmlFor="city" className="block text-gray-700">
          Stad
        </label>
        <input
          id="city"
          type="text"
          value={data.city}
          onChange={(e) => onUpdate("city", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv staden där barnet bor..."
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