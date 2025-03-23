import React, { useState, useEffect, useContext  } from 'react';
import { UserContext } from './UserContext';
import { faStar, faDollarSign, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeletePromoCodeModal from "./DeletePromoCodeModal";





const AffiliatePromoCode = () => {
    const { currentUser } = useContext(UserContext); 
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
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const userId = currentUser?.id;
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedPromoCodeId, setSelectedPromoCodeId] = useState(null);
  const [toast, setToast] = useState(null);







// Toast-komponent
const Toast = ({ message, onClose, type = "success" }) => {
  const bgColor =
    type === "success" ? "bg-green-100 border-green-600 text-green-600" : "bg-red-100 border-red-600 text-red-600";

  React.useEffect(() => {
    const timer = setTimeout(onClose, 2000); // Stängs automatiskt efter 2 sekunder
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="p-6 rounded shadow-lg border w-[400px] bg-warmWhite">
        <div className="p-4 bg-white rounded shadow-md">
          <div className="text-center">
            <h3 className="text-xl font-bold text-turquoise">
              {type === "success" ? <p className="mt-2 text-turquoise">{message}</p>: "Fel"}
            </h3>
          
          </div>
        </div>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 text-lg font-semibold ${
            type === "success" ? "text-green-600" : "text-red-600"
          } hover:opacity-70`}
        >
          ✕
        </button>
      </div>
    </div>
  );
  
  
};


// Uppdaterad handleAddPromoCode-funktion
const handleAddPromoCode = async () => {
  if (!newCode || !discount || (!isIndefinite && (!startDate || !endDate))) {
    setToast({ message: 'Fyll i alla fält eller markera Tills vidare.', type: 'error' });
    return;
  }

  if (!userId) {
    setToast({ message: 'Du måste vara inloggad för att skapa rabattkoder.', type: 'error' });
    return;
  }

  const payload = {
    code: newCode,
    discount: parseInt(discount, 10),
    user_id: userId,
    email: currentUser?.email,
    start_date: isIndefinite ? null : startDate,
    end_date: isIndefinite ? null : endDate,
    is_indefinite: isIndefinite,
  };

  console.log("Payload som skickas till backend:", payload);

  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/affiliate/add-promo-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      fetchPromoCodes();
      setNewCode('');
      setDiscount('');
      setStartDate('');
      setEndDate('');
      setIsIndefinite(false);
      setToast({ message: 'Rabattkod tillagd!', type: 'success' });
    } else {
      const errorData = await response.json();
      console.error('Fel från backend:', errorData);
      setToast({ message: `Kunde inte lägga till rabattkod: ${errorData.error || 'Okänt fel'}`, type: 'error' });
    }
  } catch (error) {
    console.error('Error adding promo code:', error);
    setToast({ message: 'Ett fel inträffade. Försök igen.', type: 'error' });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    console.log("tierUsages uppdaterat:", tierUsages);
  }, [tierUsages]);
  

  const handleWithdraw = async () => {
    try {
      const response = await fetch('http://localhost:5000/affiliate/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id, // Skicka användarens ID
          amount: calculateTotalEarnings(),
        }),
      });
  
      if (!response.ok) {
        throw new Error('Misslyckades att genomföra uttag.');
      }
  
      const data = await response.json();
      alert('Ditt uttag har behandlats! Det kan ta några dagar innan pengarna syns på ditt konto.');
      setWithdrawModalOpen(false);
      fetchPromoCodes(); // Uppdatera koderna efter uttag
      fetchTierUsages(); // Uppdatera användningar efter uttag
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Ett fel inträffade vid uttag. Försök igen senare.');
    }
  };

const handleCodeChange = async (e) => {
  const code = e.target.value.trim();
  setNewCode(code);

  if (!code) {
    setCodeError(false);
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/affiliate/check-promo-code?code=${code}`);
    const data = await response.json();
    if (data.exists) {
      setCodeError(true); // Visa fel om koden finns
    } else {
      setCodeError(false); // Ingen konflikt
    }
  } catch (error) {
    console.error('Error checking promo code:', error);
    setCodeError(false); // Anta ingen konflikt vid fel
  }
};


useEffect(() => {
    if (userId) {
      console.log('CurrentUser i AffiliatePromoCode:', currentUser);
      fetchPromoCodes();
      fetchTiers();
      fetchTierUsages();
    } else {
      console.warn('Ingen användare inloggad eller userId saknas.');
    }
  }, [userId]);

  const fetchPromoCodes = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/affiliate/promo-codes?user_id=${userId}`);
      const data = await response.json();
      setPromoCodes(Array.isArray(data.codes) ? data.codes : []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };
  
  

  const fetchTiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/affiliate/tiers');
      const data = await response.json();
      console.log("Tiers hämtade från API:", data); // Logga det som hämtas
      setTiers(data);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };
  useEffect(() => {
    console.log("Tiers uppdaterat:", tiers);
  }, [tiers]);
  

  const fetchTierUsages = async () => {
    if (!userId) return;
  
    try {
      const response = await fetch(`http://localhost:5000/affiliate/promo-code-usage?user_id=${userId}`);
      const data = await response.json();
  
      console.log('Tier usages fetched:', data);
      setTierUsages(data); // Data är kopplad till användning av tiers
    } catch (error) {
      console.error('Error fetching tier usages:', error);
    }
  };
  


  
  const calculateTotalEarnings = () => {
    return promoCodes.reduce((total, code) => {
      const earningsForCode = tiers.reduce((sum, tier) => {
        const usage = tierUsages[code.id]?.find((usage) => usage.tier_id === tier.id) || { usage_count: 0 };
        const earningsPerUse = calculateEarnings(code.discount, tier.id);
        return sum + usage.usage_count * earningsPerUse;
      }, 0);
      return total + earningsForCode;
    }, 0).toFixed(2); // Formatera till två decimaler
  };
  
  
  const calculateEarnings = (discount, tierId) => {
    // Ersättningsstruktur
    const earningsMap = {
      1: { // Tier 1
        10: 0.70, // 10% rabatt
        15: 0.50, // 15% rabatt
        20: 0.30, // 20% rabatt
      },
      2: { // Tier 2
        10: 0.90,
        15: 0.70,
        20: 0.50,
      },
      3: { // Tier 3
        10: 1.00,
        15: 0.80,
        20: 0.60,
      },
    };
  
    // Kontrollera att tierId och rabattprocent finns i mappningen
    if (earningsMap[tierId] && earningsMap[tierId][discount]) {
      return earningsMap[tierId][discount];
    }
  
    // Om inget matchar, returnera 0
    return 0;
  };
  

  const handleDeletePromoCode = (promoCodeId) => {
    setSelectedPromoCodeId(promoCodeId);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setDeleteModalOpen(false);
    setSelectedPromoCodeId(null);
  };

  return (
    <div >
           {isWithdrawModalOpen && (
  <div
  className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
    isWithdrawModalOpen ? "" : "hidden"
  }`}
>
  <div className="bg-warmWhite w-[500px] rounded shadow-lg p-6 relative">
    {/* Stäng-knapp */}
    <button
      className="absolute top-2 right-2 bg-lavenderPurple text-white px-2 py-1 rounded hover:shadow-md transition-shadow duration-200"
      onClick={() => setWithdrawModalOpen(false)}
    >
      X
    </button>

    {/* Titel */}
    <h2 className="text-2xl font-bold mb-4 text-center text-turquoise">
      <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-gold" />
      Begär Utbetalning
    </h2>
    <p className="text-gray-600 text-center mb-6">
      Här är en översikt över dina intjänade pengar baserat på dina rabattkoder.
    </p>

    {/* Översiktstabell */}
    <ul className="space-y-4 mb-4">
      {promoCodes.map((code) => {
        const earningsForCode = tiers.reduce((sum, tier) => {
          const usage = tierUsages[code.id]?.find((usage) => usage.tier_id === tier.id) || { usage_count: 0 };
          const earningsPerUse = calculateEarnings(code.discount, tier.id);
          return sum + usage.usage_count * earningsPerUse;
        }, 0);

        return (
          <li
            key={code.id}
            className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded shadow"
          >
            <span className="font-medium">{code.code}</span>
            <span className="text-gray-700">${earningsForCode.toFixed(2)}</span>
          </li>
        );
      })}
    </ul>

    {/* Disclaimer */}
    <div className="bg-gray-100 p-4 rounded shadow-sm text-sm text-gray-600 mb-6">
      <FontAwesomeIcon icon={faInfoCircle} className="text-gold mr-2" />
      <strong>Viktig information:</strong>
      <ul className="list-disc list-inside mt-2">
        <li>Vi ansvarar inte för skatter – du måste rapportera din inkomst enligt lokala lagar.</li>
        <li>Eventuella tekniska problem eller förseningar kan inträffa.</li>
        <li>Endast belopp över $50 kan tas ut.</li>
        <li>Glöm inte att lägga till ditt uppgifter till Stripe. Detta gör du i sektionen "Konto".</li>
      </ul>
    </div>

    {/* Knappgrupp */}
    <div className="flex justify-end space-x-4">
      <button
        onClick={() => setWithdrawModalOpen(false)}
        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
      >
        Avbryt
      </button>
      <button
        onClick={handleWithdraw}
        disabled={calculateTotalEarnings() < 50}
        className={`px-4 py-2 rounded text-white ${
          calculateTotalEarnings() < 50
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-turquoise hover:bg-blue-600"
        }`}
      >
        Godkänn uttag
      </button>
    </div>
  </div>
</div>

)}






       <div className="flex justify-between items-center mb-4 m-[30px]">
  <h2 className="text-4xl text-turquoise ml-[7%] font-semibold">Bli Affiliate </h2>
  <div className="flex items-center space-x-4">
    <p className="text-xl font-bold text-gray-700">Tot: ${calculateTotalEarnings()}</p>
    <button
      onClick={() => setWithdrawModalOpen(true)}
      className="bg-turquoise text-white px-4 py-2 rounded hover:bg-turquoise transition-transform transform hover:scale-105"
    >
      Ta ut
    </button>
  </div>
</div>


      <div className="mb-6 bg-gray-50 p-4 m-[30px] rounded shadow">
  <h3 className="font-bold text-lg mb-2">Hur fungerar det?</h3>
  <p className="text-gray-700 mb-2">
    När du skapar en personlig rabattkod kan du dela den i dina sociala medier, på din blogg, eller med dina vänner och nätverk. 
    Varje gång någon använder din kod för att köpa krediter på vår plattform får de en rabatt baserat på den procentsats du valt.
  </p>
  <p className="text-gray-700 mb-2">
    Som tack för att du hjälper oss att sprida ordet får du en ersättning för varje köp som görs med din kod. Ersättningen varierar
    beroende på vilken rabatt som används och vilket paket kunden köper.
  </p>
  <p className="text-gray-700">
    Dessutom belönas du med en extra bonus på $10 varje gång dina koder genererar 100 köp totalt. Det är ett utmärkt sätt att tjäna
    pengar samtidigt som du hjälper dina följare och vänner att få tillgång till våra tjänster till rabatterade priser!
  </p>

  <h4 className="font-semibold mt-4">Exempel:</h4>
  <ul className="list-disc list-inside text-gray-700">
    <li>
      Om du skapar en kod med <strong>10% rabatt</strong> och den används av <strong>90 personer</strong> för att köpa <strong>paket 2 ($14.95)</strong>, tjänar du:
      <ul className="list-disc list-inside pl-4">
        <li>0.90 dollar per köp x 90 köp = <strong>$81</strong>.</li>
      </ul>
    </li>
    <li className="mt-2">
      Om du skapar en kod med <strong>15% rabatt</strong> och den används av <strong>125 personer</strong> för att köpa <strong>paket 3 ($19.95)</strong>, tjänar du:
      <ul className="list-disc list-inside pl-4">
        <li>0.80 dollar per köp x 125 köp = <strong>$100</strong>.</li>
        <li>+ $10 i bonus för varje 100 köp = <strong>$10</strong>.</li>
        <li>Total: <strong>$110</strong>.</li>
      </ul>
    </li>
  </ul>
</div>


      <div className="mb-6 bg-gray-50 p-4 m-[30px] rounded shadow">
        <h3 className="font-bold text-lg mb-2">Ersättning per Paket och Rabatt</h3>
        <table className="table-auto w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Rabatt</th>
              <th className="border border-gray-300 px-4 py-2">Paket 1 &nbsp;&nbsp;&nbsp;500 <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" /></th>
              <th className="border border-gray-300 px-4 py-2">Paket 2 &nbsp;&nbsp;&nbsp;900 <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" /></th>
              <th className="border border-gray-300 px-4 py-2">Paket 3 &nbsp;&nbsp;&nbsp;1400 <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" /></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">10%</td>
              <td className="border border-gray-300 px-4 py-2">$0.70</td>
              <td className="border border-gray-300 px-4 py-2">$0.90</td>
              <td className="border border-gray-300 px-4 py-2">$1.00</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">15%</td>
              <td className="border border-gray-300 px-4 py-2">$0.50</td>
              <td className="border border-gray-300 px-4 py-2">$0.70</td>
              <td className="border border-gray-300 px-4 py-2">$0.80</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">20%</td>
              <td className="border border-gray-300 px-4 py-2">$0.30</td>
              <td className="border border-gray-300 px-4 py-2">$0.50</td>
              <td className="border border-gray-300 px-4 py-2">$0.60</td>
            </tr>
          </tbody>
        </table>
        <h3 className="font-bold text-turquoise text-lg mt-4">Bonus</h3>
        <p>Få $10 extra för varje 100 köp som genereras med dina koder.</p>
        </div>
        <div className="m-[30px]">
        <h2 className="text-xl font-semibold mb-4">Skapa ny rabattkod</h2>
        <p className="text-sm text-gray-600 mb-6">
        En rabattkod kan se ut som <span className="font-semibold text-turquoise">Maja10</span>, 
        där "Maja" är ditt valda namn och "10" står för 10% rabatt. Gör din kod unik och lätt att komma ihåg!
                </p>
        <div className="space-y-4 mb-6">
        <div className="space-y-4 mb-6">
        <input
            type="text"
            value={newCode}
            onChange={(e) => handleCodeChange(e)}
            placeholder="Rabattkod"
            className={`border px-4 py-2 rounded shadow-sm w-full ${codeError ? 'border-red-500' : 'border-gray-300'}`}
        />
        {codeError && <p className="text-red-500 text-sm">Den här koden är redan upptagen. Välj ett annat namn.</p>}
        </div>


  <h3 className="text-lg font-semibold mb-2">Välj rabatt</h3>
  <div className="grid grid-cols-3 gap-4 m-[30px]">
    {/* 10% Rabatt */}
    <div
      className={`mb-6 bg-gray-50 p-4 rounded shadow cursor-pointer hover:bg-gray-100 transition ${
        discount === '10' ? 'ring-2 ring-turquoise' : ''
      }`}
      onClick={() => setDiscount('10')}
    >
      <div className="flex items-center justify-center mb-2">
        <span className="text-3xl text-turquoise font-bold">10%</span>
      </div>
      <p className="text-center text-turquoise font-medium">Rabatt</p>
    </div>

    {/* 15% Rabatt */}
    <div
      className={`mb-6 bg-gray-50 p-4 rounded shadow cursor-pointer hover:bg-gray-100 transition ${
        discount === '15' ? 'ring-2 ring-turquoise' : ''
      }`}
      onClick={() => setDiscount('15')}
    >
      <div className="flex items-center justify-center mb-2">
        <span className="text-3xl text-turquoise font-bold">15%</span>
      </div>
      <p className="text-center text-turquoise font-medium">Rabatt</p>
    </div>

    {/* 20% Rabatt */}
    <div
      className={`mb-6 bg-gray-50 p-4 rounded shadow cursor-pointer hover:bg-gray-100 transition ${
        discount === '20' ? 'ring-2 ring-turquoise' : ''
      }`}
      onClick={() => setDiscount('20')}
    >
      <div className="flex items-center justify-center mb-2">
        <span className="text-3xl text-turquoise font-bold">20%</span>
      </div>
      <p className="text-center text-turquoise font-medium">Rabatt</p>
    </div>
  </div>

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

  <button onClick={handleAddPromoCode} className="bg-turquoise text-white px-4 py-2 rounded hover: transform transition-transform duration-200 hover:scale-110">
        Lägg till
      </button>

      {/* Visa toast om det finns */}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} type={toast.type} />}
   
</div>


      <h2 className="text-xl font-semibold mb-4">Mina rabattkoder</h2>
      {promoCodes.length === 0 ? (
        
  <p className="text-gray-600">Inga rabattkoder hittades.</p>
) : (
    
  <ul className="space-y-4">
    
    {promoCodes.map((code) => {
        
      // Beräkna total intäkt för koden
      const totalEarnings = tiers.reduce((sum, tier) => {
        const usage = tierUsages[code.id]?.find((usage) => usage.tier_id === tier.id) || { usage_count: 0 };
        const earningsPerUse = calculateEarnings(code.discount, tier.id);
        return sum + usage.usage_count * earningsPerUse;
      }, 0);

      return (
        <li key={code.id} className="bg-gray-100 px-4 py-3 rounded shadow">
          <div className="flex justify-between items-center">
            <div>
              <p><strong>Kod:</strong> {code.code}</p>
              <p><strong>Rabatt:</strong> {code.discount}%</p>
              <p><strong>Användningar:</strong> {code.uses}</p>
              <p><strong>Giltig från:</strong> {code.start_date || 'Tills vidare'}</p>
              <p><strong>Giltig till:</strong> {code.end_date || 'Tills vidare'}</p>
              <p><strong>Intjänat:</strong> ${totalEarnings.toFixed(2)}</p>
              {tiers.length > 0 && (
                <ul className="mt-2">
                  {tiers.map((tier) => {
                    const usage = tierUsages[code.id]?.find((usage) => usage.tier_id === tier.id) || { usage_count: 0 };
                    return (
                      <li key={tier.id} className="text-sm text-gray-700">
                        Paket {tier.credits}: {usage.usage_count} gånger
                      </li>
                    );
                  })}

                </ul>
              )}
            </div>
            <div className="space-x-2">
            <button
              onClick={() => handleDeletePromoCode(code.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover: transform transition-transform duration-200 hover:scale-110"
            >
              Radera
            </button>
            </div>
          </div>
        </li>
        
      );
      
    })}
  </ul>
  
)}
  <DeletePromoCodeModal
        isOpen={isDeleteModalOpen}
        onClose={handleModalClose}
        onDelete={fetchPromoCodes} // Uppdaterar listan efter radering
        promoCodeId={selectedPromoCodeId}
      />
    </div>
    </div>
  );
};

export default AffiliatePromoCode;
