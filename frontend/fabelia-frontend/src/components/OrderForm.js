import { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import * as pdfjs from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry"; // 🚀 Viktigt för att läsa PDF i webbläsaren!
import { UserContext } from './UserContext';

export default function OrderForm({ pdfUrl }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    country: "SE", // 🔥 Standardvärde Sverige
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [pageCount, setPageCount] = useState(null); // 🆕 Spara antal sidor i PDF
  const { currentUser } = useContext(UserContext); // Använd UserContext om den fungerar
  const [userId, setUserId] = useState(null); // 🆕 Lokalt state för user_id

  // 🔥 Hämta user_id direkt från localStorage vid render
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      console.log("✅ user_id hämtat från localStorage:", storedUserId);
    } else {
      console.error("❌ Ingen user_id hittades i localStorage");
    }
  }, []);

  // 🔥 Logga `pdfUrl` när komponenten laddas
  useEffect(() => {
    console.log("📄 `pdfUrl` mottagen i OrderForm:", pdfUrl);

    const countPages = async () => {
      if (!pdfUrl) return;
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPageCount(pdf.numPages); // ✅ Spara antal sidor
      } catch (error) {
        console.error("Kunde inte räkna sidor i PDF:", error);
        setPageCount(null);
      }
    };

    countPages();
  }, [pdfUrl]); // 🔥 Körs när `pdfUrl` ändras

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  console.log("👤 currentUser i OrderForm:", currentUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOrderSuccess(null);

    console.log("🚀 Försöker skicka Gelato-optimerad beställning...");

    if (!pdfUrl) {
        setOrderSuccess("❌ Ingen PDF har valts för beställning!");
        setLoading(false);
        return;
    }
    const userId = currentUser?.id;  // Säkerställ att currentUser finns
    console.log("🆔 User ID som skickas:", userId);
    if (!userId) {
        console.error("❌ User ID saknas!");
        setOrderSuccess("❌ Du måste vara inloggad för att beställa.");
        setLoading(false);
        return;
    }
    console.log("📤 JSON som skickas till Flask:", JSON.stringify({
      user_id: userId,  // Hämta user_id från localStorage
      pdf_url: pdfUrl,
      page_count: pageCount,
      customer_name: formData.name,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      postal_code: formData.postalCode,
      email: formData.email,
  }, null, 2)); // 👀 Gör det läsbart i konsolen
  
    try {
        const response = await fetch("http://127.0.0.1:5000/order-book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id:userId,
                pdf_url: pdfUrl,
                page_count: pageCount,
                customer_name: formData.name,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                postal_code: formData.postalCode,
                email: formData.email,
            }),
        });

        const data = await response.json();
        console.log("📦 API-svar från Flask:", data);

        if (response.ok) {
            setOrderSuccess(`✅ Beställningen har skickats! Order-ID: ${data.order_id}`);
        } else {
            setOrderSuccess(`❌ Misslyckades att beställa boken: ${data.error}`);
        }
    } catch (error) {
        setOrderSuccess(`❌ Tekniskt fel: ${error.message}`);
        console.error("❌ API-fel:", error);
    } finally {
        setLoading(false);
    }
};
  

  return (
    <>
      {pageCount === null ? (
        <p className="mt-4 text-lg font-semibold text-gray-700">Läser in PDF...</p>
      ) : pageCount < 25 ? (
        <div className="mt-8 p-6 bg-red-100 text-red-700 rounded shadow">
          <h2 className="text-xl font-semibold">❌ Din bok har för få sidor</h2>
          <p className="mt-2">
            För att kunna beställa en fysisk bok behöver du skapa en bok med minst <strong>9 kapitel</strong> (30 sidor).
          </p>
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <p className="text-gray-700 font-semibold">📄 Antal sidor i boken: {pageCount}</p>

          <div>
            <label className="block text-gray-700 font-semibold">Ditt Namn</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
              placeholder="Skriv ditt namn"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">E-post</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
              placeholder="Din e-postadress"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Adress</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
              placeholder="Gatuadress"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold">Postnummer</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
                placeholder="123 45"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold">Stad</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
                placeholder="Din stad"
                required
              />
            </div>

            <div>
  <label className="block text-gray-700 font-semibold">Land</label>
  <select
    name="country"
    value={formData.country}
    onChange={handleChange}
    className="w-full p-2 border rounded focus:ring-2 focus:ring-turquoise"
    required
  >
    <option value="SE">Sverige</option>
    <option value="NO">Norge</option>
    <option value="DK">Danmark</option>
    <option value="FI">Finland</option>
    <option value="US">USA</option>
    <option value="GB">Storbritannien</option>
  </select>
</div>

          </div>

          {/* 🛒 Skicka beställningen */}
          <button
            type="submit"
            className="bg-turquoise text-white px-6 py-3 rounded shadow-lg hover:bg-turquoise transform transition-transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Beställer..." : (
              <>
                <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
                Beställ Boken &nbsp;
                <FontAwesomeIcon icon={faStar} className="mr-2 text-softYellow" />
              </>
            )}
          </button>

          {/* ✅ Orderbekräftelse */}
          {orderSuccess && (
            <p className="mt-4 text-lg font-semibold text-gray-700">{orderSuccess}</p>
          )}
        </form>
      )}
    </>
  );
}
