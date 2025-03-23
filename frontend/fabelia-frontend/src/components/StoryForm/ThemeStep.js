export const ThemeStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (data.theme.trim()) {
        onNext();
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Välj ett tema för berättelsen
        </h2>
        <div className="space-y-4">
          <label htmlFor="theme" className="block text-gray-700">
            Tema
          </label>
          <input
            id="theme"
            type="text"
            value={data.theme}
            onChange={(e) => onUpdate("theme", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="T.ex. Äventyr, Vänskap, Fantasy..."
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