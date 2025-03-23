export const SiblingsStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      onNext();
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Vad heter {data.childName}s syskon?
        </h2>
        <div className="space-y-4">
          <label htmlFor="siblings" className="block text-gray-700">
            Syskon
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
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Nästa
        </button>
      </form>
    );
  };