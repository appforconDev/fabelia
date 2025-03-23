import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const DeletePromoCodeModal = ({ isOpen, onClose, onDelete, promoCodeId }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/affiliate/delete-promo-code/${promoCodeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDeleteSuccess(true);
        setTimeout(() => {
          onClose(); // Stänger modalen efter 2 sekunder
          setDeleteSuccess(false);
        }, 2000);
        onDelete(); // Uppdatera listan av rabattkoder
      } else {
        const data = await response.json();
        alert(data.error || "Kunde inte radera rabattkod.");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      alert("Ett fel inträffade. Försök igen.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-warmWhite w-[500px] rounded shadow-lg p-6 relative">
       
        <div className="bg-white shadow p-4 rounded">
          {!deleteSuccess ? (
            <>
              <h2 className="text-2xl font-bold text-center text-turquoise mb-4">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-softYellow" />
                Är du säker?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Vill du verkligen radera denna rabattkod?<br /> Denna åtgärd kan inte ångras. <br />
                <strong>Observera:</strong> Om du raderar denna kod förlorar du eventuell intjänad ersättning som ännu inte tagits ut.
                <br />Se till att begära utbetalning innan du fortsätter om du vill behålla dina intjänade pengar.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-transform transform hover:scale-105"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded text-white ${
                    isDeleting
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 transition-transform transform hover:scale-105"
                  }`}
                >
                  {isDeleting ? "Raderar..." : "Radera"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-turquoise mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-turquoise" />
                Rabattkod raderad!
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletePromoCodeModal;
