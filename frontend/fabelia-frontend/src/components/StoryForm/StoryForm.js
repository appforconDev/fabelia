import { useState, useEffect, useContext } from "react";
import { FormatStep } from "./FormatStep";
import { BasicInfoStep } from "./BasicInfoStep";
import { StoryDetailsStep } from "./StoryDetailsStep";
import { RelationshipsStep } from "./RelationshipsStep";
import { LocationsAndFavoritesStep } from "./LocationsAndFavoritesStep";
import { AvatarStep } from "./AvatarStep";
import { AudioPreferencesStep } from "./AudioPreferencesStep";
import { StaticSummary } from "./StaticSummary";
import { UserContext } from '../UserContext';

// Minskat antal steg från 17 till 8 (including the summary step)
const TOTAL_STEPS = 8;

export const StoryForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    format: "sound",
    childName: "",
    childAge: 0,
    gender: "",
    theme: "",
    emotion: "",
    interests: "",
    friends: "",
    favoritePlace: "",
    siblings: "",
    parents: "",
    grandparents: "",
    favoriteAnimal: "",
    city: "",
    avatar: "",
    duration: "10",
    narrator: "female",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [credits, setCredits] = useState(0);
  const { currentUser, updateCredits, addNotification } = useContext(UserContext);

  const handleUpdate = (key, value) => {
    console.log(`Updating ${key} to:`, value); // Debugging
    setFormData((prev) => {
      const updatedData = { ...prev, [key]: value };
      console.log("Updated formData:", updatedData); // Debugging
      return updatedData;
    });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setStatusMessage('Användar-ID saknas. Logga in och försök igen.');
      return;
    }

    setLoading(true);
    setStatusMessage('Skapar din bok...');

    try {
      const dataToSubmit = {
        name: formData.childName,
        age: formData.childAge,
        childGender: formData.gender,
        theme: formData.theme,
        mood: formData.emotion,
        interests: formData.interests,
        friends: formData.friends,
        favoritePlace: formData.favoritePlace,
        siblings: formData.siblings,
        parents: formData.parents,
        grandparents: formData.grandparents,
        favoriteAnimal: formData.favoriteAnimal,
        city: formData.city,
        avatar: formData.avatar,
        audioLength: formData.duration,
        credits: formData.credits,
        narrator: formData.narrator,
        user_id: currentUser.id,
        bookType: formData.format,
        style: formData.style,
        category: formData.category,
        staticSummary: generateStaticSummary(formData),
      };
  
      console.log('Form data to be submitted:', dataToSubmit);

      const response = await fetch('http://localhost:5000/create-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.remaining_credits !== undefined) {
        updateCredits(data.remaining_credits);
      }
      addNotification(`Din bok "${formData.childName}" är klar!`);

      setLoading(false);
      setStatusMessage('Boken skapades framgångsrikt!');
    } catch (error) {
      setStatusMessage('Ett fel inträffade: ' + error.message);
      console.error('Error creating book:', error);
      setLoading(false);
    }
  }; 

  const generateStaticSummary = (formData) => {
    const parts = [];
    parts.push(`Du har valt att skapa en ${formData.format === "sound" ? "ljudbok" : "bok"} vars hjälte är ${formData.childName || "ett barn utan namn"}`);
    if (formData.childAge) parts.push(`, en ${formData.childAge} år gammal`);
    parts.push(formData.gender === "boy" ? "pojke" : "flicka");
    parts.push(".");
    if (formData.theme) parts.push(`på temat ${formData.theme}.`);
    if (formData.interests) parts.push(`${formData.childName || "Barnet"} gillar att ${formData.interests}.`);
    if (formData.friends) parts.push(`${formData.childName || "Barnet"} har vänner som heter ${formData.friends}.`);
    if (formData.siblings) parts.push(`Syskonen heter ${formData.siblings}.`);
    if (formData.parents) parts.push(`Föräldrarna heter ${formData.parents}.`);
    if (formData.grandparents) parts.push(`Mor- och farföräldrarna är ${formData.grandparents}.`);
    if (formData.favoritePlace) parts.push(`En av ${formData.childName || "barnets"} favoritplatser är ${formData.favoritePlace}.`);
    if (formData.favoriteAnimal) parts.push(`Favoritdjuret är en ${formData.favoriteAnimal}.`);
    if (formData.city) parts.push(`${formData.childName || "Barnet"} bor i ${formData.city}.`);
    if (formData.avatar) parts.push(`Avataren som valts är ${formData.avatar}.`);
    if (formData.duration) parts.push(`Ljudboken är ${formData.duration} minuter lång.`);
    if (formData.narrator) parts.push(`Uppläsaren är ${formData.narrator === "male" ? "manlig" : "kvinnlig"}.`);

    return parts.join(" ");
  };

  const fetchCredits = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/get-credits?user_id=${userId}`);
      if (!response.ok) {
        throw new Error(`Serverfel: ${response.status}`);
      }
      const data = await response.json();
      return data.credits;
    } catch (error) {
      console.error("Fel vid hämtning av credits:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!currentUser || !currentUser.id) {
        console.error("currentUser saknar attribut 'sub'");
        return;
      }

      const userId = currentUser.id;
      const credits = await fetchCredits(userId);
      setCredits(credits);
    };

    if (currentUser) {
      fetchUserCredits();
    }
  }, [currentUser]);

  const renderStep = () => {
    const props = {
      data: formData,
      onUpdate: handleUpdate,
      onNext: handleNext,
      onBack: handleBack,
    };

    switch (currentStep) {
      case 1:
        return <FormatStep {...props} />;
      case 2:
        return <BasicInfoStep {...props} />;
      case 3:
        return <StoryDetailsStep {...props} />;
      case 4:
        return <RelationshipsStep {...props} />;
      case 5:
        return <LocationsAndFavoritesStep {...props} />;
      case 6:
        return <AvatarStep {...props} />;
      case 7:
        return <AudioPreferencesStep {...props} />;
      case 8:
        return <StaticSummary {...props} onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className=" py-12 px-4 bg-gradient-to-b from-warmWhite to-white flex justify-center"
    style={{ maxHeight: '70vh' }}>
      <div className="form-container bg-white rounded-lg shadow-lg p-6 m-6 max-w-3xl w-full">
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <p className="text-sm text-center mt-2 text-gray-600">
            Steg {currentStep} av {TOTAL_STEPS}
          </p>
        </div>
        <div className="step-transition">{renderStep()}</div>
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              onClick={handleBack}
            >
              Tillbaka
            </button>
          )}
          <div className="flex-1" />
          {currentStep === TOTAL_STEPS && (
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={handleSubmit}
            >
              Skapa berättelse
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default StoryForm;
