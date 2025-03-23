export const FavoritePlaceStep = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.favoritePlace.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Vad är {data.childName}s favoritplats?
      </h2>
      <div className="space-y-4">
        <label htmlFor="favoritePlace" className="block text-gray-700">
          Favoritplats
        </label>
        <input
          id="favoritePlace"
          type="text"
          value={data.favoritePlace}
          onChange={(e) => onUpdate("favoritePlace", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="T.ex. Parken, Stranden, Mormors hus..."
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