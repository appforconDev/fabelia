import React, { useState, useEffect } from "react";

const StripeAccount = ({ currentUser }) => {
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStripeAccountId = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/get-stripe-account?user_id=${currentUser.id}`
      );
      const data = await response.json();

      if (response.ok && data.stripe_account_id) {
        setStripeAccountId(data.stripe_account_id);
        setInputValue(data.stripe_account_id);
        setIsEditing(false); // Viktigt: sätt till false när vi har data
      } else {
        // Endast sätt isEditing till true om vi inte har något konto
        setStripeAccountId("");
        setInputValue("");
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Fel vid hämtning av Stripe-konto-ID:", error);
      setStripeAccountId("");
      setInputValue("");
      setIsEditing(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Kör fetchStripeAccountId när komponenten monteras och när currentUser ändras
  useEffect(() => {
    fetchStripeAccountId();
  }, [currentUser?.id]);

  const handleEditClick = () => {
    setIsEditing(true);
    setInputValue(stripeAccountId); // Sätt inputValue till nuvarande stripeAccountId
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setInputValue(stripeAccountId); // Återställ till sparat värde
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSaveStripeDetails = async () => {
    if (!inputValue.trim()) {
      setMessage("Ange ett giltigt Stripe-konto-ID");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/save-stripe-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          stripe_account_id: inputValue,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStripeAccountId(inputValue);
        setIsEditing(false); // Stäng redigeringsläget
        setMessage("Konto sparat");
        
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.error || "Ett fel inträffade.");
      }
    } catch (error) {
      console.error("Fel vid sparande av Stripe-konto:", error);
      setMessage("Ett fel inträffade. Försök igen.");
    }
  };

  if (isLoading) {
    return <div className="mt-6">Laddar...</div>;
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-4 text-turquoise">Stripe-kontoinformation</h2>
      <div className="space-y-4">
        {!isEditing ? (
          stripeAccountId ? (
            <div className="flex justify-between items-center">
              <p className="text-gray-800">
                <strong>Stripe Konto ID:</strong> {stripeAccountId}
              </p>
              <button 
                onClick={handleEditClick}
                className="text-blue-500 hover:underline"
              >
                Redigera
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-gray-600">Inget Stripe-konto konfigurerat.</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-blue-500 hover:underline"
              >
                Lägg till konto
              </button>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-col">
              <label htmlFor="stripe-account-id" className="text-gray-700 font-medium">
                Stripe Konto ID
              </label>
              <input
                type="text"
                id="stripe-account-id"
                placeholder="Ange ditt Stripe-konto-ID"
                className="border px-4 py-2 rounded shadow-sm w-full"
                value={inputValue}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSaveStripeDetails}
                className="bg-turquoise text-white px-4 py-2 rounded hover:bg-blue-600 transition-transform transform hover:scale-105"
              >
                Spara
              </button>
              {stripeAccountId && (
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Avbryt
                </button>
              )}
            </div>
          </>
        )}
        {message && <p className="mt-4 text-green-600">{message}</p>}
      </div>
    </section>
  );
};

export default StripeAccount;