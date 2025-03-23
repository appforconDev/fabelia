export const ParentsStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (data.parents.trim()) {
        onNext();
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Vad heter {data.childName}s föräldrar?
        </h2>
        <div className="space-y-4">
          <label htmlFor="parents" className="block text-gray-700">
            Föräldrar
          </label>
          <input
            id="parents"
            type="text"
            value={data.parents}
            onChange={(e) => onUpdate("parents", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Skriv föräldrarnas namn..."
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