import React, { useState, useMemo, useContext  } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faDollarSign, faShoppingCart, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import visaLogo from "../assets/images/visa.png";
import mastercardLogo from "../assets/images/mastercard.webp";
import stripeLogo from "../assets/images/stripe.webp";
import { UserContext } from './UserContext';


const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);



const CheckoutForm = ({ tier, discount, promoCodeId, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { currentUser } = useContext(UserContext);

  const waitForCreditsUpdate = async (userId, expectedIncrease) => {
    console.log("Waiting for credits update...");
    const maxAttempts = 10;
    const delay = 1000; // 1 second between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:5000/api/get-credits?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`Current credits (attempt ${attempt + 1}):`, data.credits);
          return true;
        }
      } catch (error) {
        console.error("Error checking credits:", error);
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return false;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
        console.error("Stripe eller Elements är inte initialiserade.");
        setMessage("Stripe är inte initialiserat.");
        return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log("PromoCodeId skickas till backend:", promoCodeId); 
      const response = await fetch("http://localhost:5000/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          tier_id: tier.id,
          price_in_cents: tier.discountedPriceInCents,
          original_price_in_cents: tier.price * 100,
          discount,
          promo_code_id: promoCodeId, // Lägg till rabattkodens ID
        }),
      });
      
        if (!response.ok) {
            throw new Error("Misslyckades att skapa PaymentIntent.");
        }

        const { clientSecret } = await response.json();

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        });

        if (result.error) {
            setMessage(`Betalningsfel: ${result.error.message}`);
            onPaymentError(result.error.message);
        } else if (result.paymentIntent.status === "succeeded") {
            setMessage("Betalning genomförd!");
            
            // Wait for webhook to process
        console.log("Waiting for webhook processing...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if credits were updated
        const creditsUpdated = await waitForCreditsUpdate(currentUser.id);
        
        if (creditsUpdated) {
          console.log("Credits update confirmed");
          if (onPaymentSuccess) {
            await onPaymentSuccess();
            console.log("Payment success callback completed");
          }
        } else {
          console.log("Credits update not confirmed after maximum attempts");
          // Still call success since payment went through
          if (onPaymentSuccess) {
            await onPaymentSuccess();
          }
        }
      }
    } catch (error) {
        console.error("Ett fel inträffade under betalningen:", error);
        setMessage("Ett fel inträffade. Försök igen.");
        onPaymentError("Ett fel inträffade.");
    } finally {
        setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{ hidePostalCode: true }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-turquoise text-white px-4 py-2 rounded mt-4 hover: transform transition-transform duration-200 hover:scale-110 "
      >
        {loading ? "Behandlar..." : "Betala"}
      </button>
      {loading && (
        <div className="mt-4 text-center">
          <div className="spinner-border animate-spin inline-block w-6 h-6 border-4 rounded-full border-turquoise border-t-transparent"></div>
          <p className="text-sm text-turquoise mt-2">Hämtar Stjärnor...</p>
        </div>
      )}
      {message && <p className="text-turquoise mt-4">{message}</p>}
    </form>
  );
};

const CreditModal = ({ isOpen, onClose, onPaymentSuccess, asSection = false }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isPromoCodeApplied, setIsPromoCodeApplied] = useState(false);
  const [promoCodeId, setPromoCodeId] = useState(null); // Rabattkodens ID
  const [message, setMessage] = useState(""); 
  const { currentUser } = useContext(UserContext);

  const resetModal = () => {
    setSelectedTier(null);
    setPromoCode("");
    setPromoMessage("");
    setDiscount(0);
    setIsPromoCodeApplied(false);
    setPromoCodeId(null);
    setMessage(""); // Återställ betalningsmeddelande
  };

  const handleModalClose = () => {
    resetModal();
    onClose(); // Stäng modalen
  };

  const tiers = [
    { id: 1, credits: 500, price: 9.95, description: "Perfekt för att skapa upp till 2 böcker." },
    { id: 2, credits: 900, price: 14.95, description: "Bra värde för aktiva skapare!" },
    { id: 3, credits: 1400, price: 19.95, description: "Maximera dina besparingar för fler böcker." },
  ];

  const calculateDiscountedPrice = (price) => {
    if (!price) return "0.00";
    return discount > 0 ? (price - (price * discount / 100)).toFixed(2) : price.toFixed(2);
  };

  const tiersWithDiscount = useMemo(() => {
    return tiers.map((tier) => ({
      ...tier,
      discountedPrice: calculateDiscountedPrice(tier.price),
    }));
  }, [tiers, discount]);
 
  const handleApplyPromoCode = async () => {
    if (isPromoCodeApplied) {
      setPromoMessage("Rabattkoden är redan använd.");
      return;
    }
  
    if (!currentUser?.id || !promoCode.trim()) {
      setPromoMessage("Användar-ID och rabattkod krävs.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/affiliate/check-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser?.id,
          promo_code: promoCode.trim(),
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        if (data.alreadyUsed) {
          setPromoMessage("Den här rabattkoden har redan använts av dig.");
        } else {
          setDiscount(data.discount);
          setPromoMessage(`Rabattkod tillämpad! Rabatt: ${data.discount}%`);
          setIsPromoCodeApplied(true);
          setPromoCodeId(data.promo_code_id); // Spara promo_code_id
        }
      } else {
        setPromoMessage(data.error || "Ogiltig rabattkod.");
      }
    } catch (error) {
      console.error("Fel vid tillämpning av rabattkod:", error);
      setPromoMessage("Ett fel inträffade. Försök igen.");
    }
  };
  
  
  

  const handleSelectTier = (tier) => {
    setSelectedTier({
      ...tier,
      discountedPrice: tier.discountedPrice,
      discountedPriceInCents: Math.round(parseFloat(tier.discountedPrice) * 100),
    });
  };

  const stripeElements = useMemo(() => {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm tier={selectedTier} discount={discount} />
      </Elements>
    );
  }, [selectedTier, discount]);


 
  const handlePaymentSuccess = async () => {
    console.log("Payment succeeded, updating credits...");
    
    // Vänta en kort stund för att webhook ska hinna processa
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onPaymentSuccess) {
      await onPaymentSuccess();  // Vänta på att credits uppdateras
      console.log("Credits updated successfully");
    }
    resetModal();
    onClose();
  };
  const handlePaymentError = (errorMessage) => {
    console.error("Payment error:", errorMessage);
    // Du kan lägga till mer felhantering här om du vill, 
    // t.ex. visa ett felmeddelande för användaren
  };

  return (
    <div
      className={`${
        asSection
          ? "w-full bg-warmWhite shadow rounded-lg p-6"
          : `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? "" : "hidden"}`
      }`}
    >
      <div className={`${asSection ? "" : "bg-gradient-to-b from-warmWhite to-white w-[500px] rounded shadow-lg p-6 relative"}`}>
        {!asSection && (
          <button
            className="absolute top-2 right-2 bg-white text-black px-2 py-1 rounded hover:shadow-md transition-shadow duration-200"
            onClick={onClose}
          >
            X
          </button>
        )}

        <h2 className="text-2xl font-bold mb-4 text-center text-turquoise">
          <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
          Fyll på Stjärnor
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Välj ett paket som passar dina behov. Stjärnor används för att skapa ljudböcker och illustrationer.
        </p>

        {/* Rabattkod */}
        <div className="mb-6 w-3/5 mx-auto">
          <label htmlFor="promo-code" className="block text-gray-700 mb-2">
            Rabattkod
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="promo-code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Ange din rabattkod"
              className="border px-4 py-2 rounded shadow-sm w-full"
            />
            <button
              onClick={handleApplyPromoCode}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tillämpa
            </button>
          </div>
          {promoMessage && <p className="text-sm text-green-600 mt-2">{promoMessage}</p>}
        </div>

        {/* Tier-lista */}
        <ul className="space-y-4">
          {tiersWithDiscount.map((tier) => (
            <li
              key={tier.id}
              className={`flex justify-between items-center bg-gray-100 px-4 py-3 rounded shadow hover:transform transition-transform duration-200 hover:scale-105 ${
                selectedTier?.id === tier.id ? "ring-2 ring-turquoise" : ""
              } ${asSection ? "w-5/6 mx-auto" : ""}`}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
                  {tier.credits} Stjärnor
                </h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                  {tier.description}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {discount > 0 ? (
                    <>
                      <span className="line-through">${tier.price}</span>
                      <span className="ml-2 text-green-600">${tier.discountedPrice}</span>
                    </>
                  ) : (
                    `$${tier.price}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-lg font-bold text-green-600 flex items-center">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                  {tier.discountedPrice}
                </h4>
                <button
                  onClick={() => handleSelectTier(tier)}
                  className="bg-turquoise text-white px-4 py-2 mt-2 rounded hover:bg-turquoise flex items-center justify-center transform transition-transform duration-200 hover:scale-110"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  Välj
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Stripe Checkout */}
        {selectedTier && (
          <div className="mt-6 bg-gray-100 p-4 rounded shadow-sm">
            <Elements stripe={stripePromise}>
              <CheckoutForm
                tier={selectedTier}
                discount={discount}
                promoCodeId={promoCodeId} 
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </Elements>
          </div>
        )}

        {/* Betalningsinfo */}
        <div className="mt-6 bg-gray-100 p-4 rounded shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">
            Betalningar hanteras säkert via{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Stripe
            </a>
            . Vi lagrar inga kortuppgifter.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <img src={stripeLogo} alt="Stripe" className="h-6" title="Betalningar hanteras av Stripe" />
            <img src={mastercardLogo} alt="Mastercard" className="h-6" title="Vi accepterar Mastercard" />
            <img src={visaLogo} alt="Visa" className="h-6" title="Vi accepterar Visa" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditModal;
