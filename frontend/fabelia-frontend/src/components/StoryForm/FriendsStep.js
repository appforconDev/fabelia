import React from "react";

export const FriendsStep = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(); // Gå vidare till nästa steg oavsett om vänner är ifyllda eller inte
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Vad heter {data.childName}s vänner? (Valfritt)
      </h2>
      <div className="space-y-4">
        <label htmlFor="friends" className="block text-sm font-medium text-gray-700">
          Vänner
        </label>
        <input
          id="friends"
          type="text"
          value={data.friends}
          onChange={(e) => onUpdate("friends", e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Skriv namnen på barnets vänner..."
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Nästa
      </button>
    </form>
  );
};