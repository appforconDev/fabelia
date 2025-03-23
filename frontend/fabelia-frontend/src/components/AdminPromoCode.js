import React, { useState, useEffect } from 'react';

const AdminPromoCode = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [tierUsages, setTierUsages] = useState({});
  const [tiers, setTiers] = useState([]); // Ny state för tiers
  const [newCode, setNewCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPromoCodes();
    fetchTiers(); // Hämta alla tiers
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/promo-codes');
      const data = await response.json();
      setPromoCodes(Array.isArray(data.codes) ? data.codes : []);
      fetchTierUsages(); // Hämta användningar för alla koder
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setPromoCodes([]);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/tiers'); // Endpoint för att hämta alla tiers
      const data = await response.json();
      setTiers(data);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchTierUsages = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/promo-code-usage');
      const data = await response.json();
      const usageMap = data.reduce((acc, usage) => {
        if (!acc[usage.promo_code_id]) {
          acc[usage.promo_code_id] = [];
        }
        acc[usage.promo_code_id].push(usage);
        return acc;
      }, {});
      setTierUsages(usageMap);
    } catch (error) {
      console.error('Error fetching tier usages:', error);
      setTierUsages({});
    }
  };

  const handleAddPromoCode = async () => {
    if (!newCode || !discount || (!isIndefinite && (!startDate || !endDate))) {
      alert('Fyll i alla fält eller markera Tills vidare.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/admin/add-promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discount: parseInt(discount, 10),
          email,
          start_date: isIndefinite ? null : startDate,
          end_date: isIndefinite ? null : endDate,
          is_indefinite: isIndefinite,
        }),
      });
      if (response.ok) {
        fetchPromoCodes();
        setNewCode('');
        setDiscount('');
        setEmail('');
        setStartDate('');
        setEndDate('');
        setIsIndefinite(false);
        alert('Rabattkod tillagd!');
      } else {
        alert('Kunde inte lägga till rabattkod.');
      }
    } catch (error) {
      console.error('Error adding promo code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromoCode = async (promoCodeId) => {
    if (!window.confirm("Är du säker på att du vill radera denna rabattkod?")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/admin/delete-promo-code/${promoCodeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Rabattkod raderad!");
        fetchPromoCodes(); // Uppdatera listan efter radering
      } else {
        const data = await response.json();
        alert(data.error || "Kunde inte radera rabattkod.");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      alert("Ett fel inträffade. Försök igen.");
    }
  };

  const handleSendEmail = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/send-email/${id}`, {
        method: 'POST',
      });
      if (response.ok) {
        alert('E-post skickad!');
      } else {
        alert('Kunde inte skicka e-post.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Skapa ny rabattkod</h2>
      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Rabattkod"
          className="border px-4 py-2 rounded shadow-sm w-full"
        />
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="Rabatt i %"
          className="border px-4 py-2 rounded shadow-sm w-full"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-post för kodens mottagare"
          className="border px-4 py-2 rounded shadow-sm w-full"
        />
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
            disabled={isIndefinite}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
            disabled={isIndefinite}
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isIndefinite}
              onChange={() => setIsIndefinite(!isIndefinite)}
              className="h-4 w-4"
            />
            <span>Tills vidare</span>
          </label>
        </div>
        <button
          onClick={handleAddPromoCode}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          Lägg till
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Befintliga rabattkoder</h2>
      {promoCodes.length === 0 ? (
        <p className="text-gray-600">Inga rabattkoder hittades.</p>
      ) : (
        <ul className="space-y-4">
          {promoCodes.map((code) => (
            <li key={code.id} className="bg-gray-100 px-4 py-3 rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p><strong>Kod:</strong> {code.code}</p>
                  <p><strong>Rabatt:</strong> {code.discount}%</p>
                  <p><strong>Användningar:</strong> {code.uses}</p>
                  <p><strong>Giltig från:</strong> {code.start_date || 'Tills vidare'}</p>
                  <p><strong>Giltig till:</strong> {code.end_date || 'Tills vidare'}</p>
                  {tiers.length > 0 && (
                    <ul className="mt-2">
                      {tiers.map((tier) => {
                        const usage = tierUsages[code.id]?.find((usage) => usage.tier_id === tier.id) || { usage_count: 0 };

                        return (
                          <li key={tier.id} className="text-sm text-gray-700">
                            Tier {tier.credits} : {usage.usage_count} gånger
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleDeletePromoCode(code.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Radera
                  </button>
                  <button
                    onClick={() => handleSendEmail(code.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Skicka e-post
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminPromoCode;
