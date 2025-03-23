export const EmotionStep = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.emotion.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Vilken känsla ska speglas i berättelsen?
      </h2>
      <div className="space-y-4">
        <label htmlFor="emotion" className="block text-gray-700">
          Känsla
        </label>
        <input
          id="emotion"
          type="text"
          value={data.emotion}
          onChange={(e) => onUpdate("emotion", e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="T.ex. Glädje, Mod, Nyfikenhet..."
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