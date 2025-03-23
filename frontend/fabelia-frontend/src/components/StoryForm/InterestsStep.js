export const InterestsStep = ({ data, onUpdate, onNext }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (data.interests.trim()) {
        onNext();
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn p-4">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Vad är {data.childName}s intressen?
        </h2>
        <div className="space-y-4">
          <label htmlFor="interests" className="block text-gray-700">
            Intressen
          </label>
          <textarea
            id="interests"
            value={data.interests}
            onChange={(e) => onUpdate("interests", e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="Berätta om vad barnet tycker om att göra..."
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