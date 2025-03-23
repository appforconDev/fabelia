export const LocationsAndFavoritesStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
        onNext();
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Platser och favoriter
        </h2>
  
        <div className="space-y-4">
          <label htmlFor="favoritePlace" className="block text-gray-700">
            Vad är {data.childName}s favoritplats? (Valfritt)
          </label>
          <input
            id="favoritePlace"
            type="text"
            value={data.favoritePlace}
            onChange={(e) => onUpdate("favoritePlace", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="T.ex. Parken, Stranden, Mormors hus..."
           
          />
        </div>
  
        <div className="space-y-4">
          <label htmlFor="favoriteAnimal" className="block text-gray-700">
            Vad är {data.childName}s favoritdjur? (Valfritt)
          </label>
          <input
            id="favoriteAnimal"
            type="text"
            value={data.favoriteAnimal}
            onChange={(e) => onUpdate("favoriteAnimal", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Skriv barnets favoritdjur..."
           
          />
        </div>
  
        <div className="space-y-4">
          <label htmlFor="city" className="block text-gray-700">
            I vilken stad bor {data.childName}? (Valfritt)
          </label>
          <input
            id="city"
            type="text"
            value={data.city}
            onChange={(e) => onUpdate("city", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Skriv staden där barnet bor..."
            
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