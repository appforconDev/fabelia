import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ tier, discount }) => {
  const stripe = useStripe();
  const elements = useElements();

  const calculateFinalPrice = () => {
    if (!tier?.price) return "0.00";
    return discount > 0 
      ? (tier.price - (tier.price * discount / 100)).toFixed(2)
      : tier.price.toFixed(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !tier) {
      return;
    }

    try {
      const priceInCents = Math.round(parseFloat(calculateFinalPrice()) * 100);

      console.log('Sending to backend:', {
        tier_id: tier.id,
        discount,
        priceInCents,
        originalPriceInCents: tier.priceInCents
      });

      const response = await fetch('http://localhost:5000/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: tier.id,
          user_id: "USER_ID",
          discount,
          price_in_cents: priceInCents,
          original_price_in_cents: tier.priceInCents
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Ett fel inträffade vid skapandet av betalningen.');
      }
    } catch (error) {
      console.error('Fel vid skapandet av betalningssession:', error);
    }
  };



  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button
        type="submit"
        disabled={!stripe}
        className="mt-4 bg-turquoise text-white px-4 py-2 rounded hover:bg-turquoise flex items-center justify-center"
      >
        Betala ${calculateFinalPrice()} USD
      </button>
    </form>
  );
};


export default CheckoutForm;