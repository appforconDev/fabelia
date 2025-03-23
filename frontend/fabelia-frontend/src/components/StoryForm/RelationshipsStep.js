export const RelationshipsStep = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
      onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Personer i {data.childName}s liv
      </h2>

      <div className="space-y-4">
        <label htmlFor="friends" className="block text-gray-700">
          Vad heter {data.childName}s vänner? (Valfritt)
        </label>
        <input
          id="friends"
          type="text"
          value={data.friends}
          onChange={(e) => onUpdate("friends", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv namnen på barnets vänner..."
          
        />
      </div>

      <div className="space-y-4">
        <label htmlFor="siblings" className="block text-gray-700">
          Vad heter {data.childName}s syskon?
        </label>
        <input
          id="siblings"
          type="text"
          value={data.siblings}
          onChange={(e) => onUpdate("siblings", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lämna tomt om inga syskon finns"
        />
      </div>

      <div className="space-y-4">
        <label htmlFor="parents" className="block text-gray-700">
          Vad heter {data.childName}s föräldrar? (Valfritt)
        </label>
        <input
          id="parents"
          type="text"
          value={data.parents}
          onChange={(e) => onUpdate("parents", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv föräldrarnas namn..."
         
        />
      </div>

      <div className="space-y-4">
        <label htmlFor="grandparents" className="block text-gray-700">
          Vad heter {data.childName}s far/mor-föräldrar? (Valfritt)
        </label>
        <input
          id="grandparents"
          type="text"
          value={data.grandparents}
          onChange={(e) => onUpdate("grandparents", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv far/mor-föräldrarnas namn..."
          
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