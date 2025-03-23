import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from './UserContext';
import { ChildConfig } from "./children";
import epicbg from '../assets/images/epicbg.webp';
import { BookOpen, Sparkles } from "lucide-react";


const categoryMap = {
    Barn: ChildConfig,
    // Lägg till fler kategorier här
  };


const Form = ({ onSubmit }) => {
  const category = "Barn"; // Sätt category till "Barn" som standard

    const { 
        register, 
        handleSubmit, 
        setValue, 
        getValues, 
        setFocus,
        trigger, 
        formState: { errors } 
      } = useForm({
        mode: 'onBlur' // or 'onChange'
      });
  const [currentStep, setCurrentStep] = useState(0); // Stegspårning
  const [formData, setFormData] = useState({}); // Samla in data från alla steg
  const [showWelcome, setShowWelcome] = useState(true); // Visa välkomstsektionen först
  const [randomizedAvatars, setRandomizedAvatars] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [bookType, setBookType] = useState(""); // Spara vald boktyp
  const [loading, setLoading] = useState(false); // Hantera laddningsstatus
  const [statusMessage, setStatusMessage] = useState(''); // Hantera statusmeddelanden
  const [summary, setSummary] = useState(""); // Lägg till summary state
  const [credits, setCredits] = useState(0); // Lagra användarens krediter lokalt
  const maleAvatars = ChildConfig.maleAvatars;
  const femaleAvatars = ChildConfig.femaleAvatars;
  const styles = ChildConfig.styles;
  
  const [selectedConfig, setSelectedConfig] = useState(categoryMap["Barn"] || {});
  const [showBottomText, setShowBottomText] = useState(true); 

  const { currentUser, updateCredits, addNotification, selectedCategory } = useContext(UserContext);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (loading) {
      setShowOverlay(true); // Visa overlay direkt när loading börjar
      const timer = setTimeout(() => {
        setShowOverlay(false); // Dölj overlay efter minst 3 sekunder
      }, 3000);

      return () => clearTimeout(timer); // Rensa timer om komponenten avmonteras
    } else {
      setTimeout(() => setShowOverlay(false), 3000); // Vänta 3 sekunder innan overlay försvinner
    }
  }, [loading]);


  // Bokval
  const bookOptions = [
    { key: "audiobook", name: "Ljudbok", image: "/images/ljudbok.webp" },
    { key: "pdf", name: "Bok", image: "/images/pdf.webp" },
    { key: "both", name: "Båda", image: "/images/both.webp" },
  ];

  const handleStart = () => {
    setShowWelcome(false); // Visa formuläret
    setShowBottomText(false); 
  };

  const handleBookTypeSelect = (type) => {
    setBookType(type);
    setCurrentStep(currentStep + 1); // Gå till nästa steg
  };

  

  

  // Fisher-Yates-algoritmen för att slumpa
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };


  
  
  const getCurrentField = () => {
    const fieldIndex = currentStep - 1; // Justera indexet
    if (!selectedConfig.fields || fieldIndex >= selectedConfig.fields.length || fieldIndex < 0) {
      console.error('Invalid step or no fields found');
      return null;
    }
    return selectedConfig.fields[fieldIndex];
  };
  
  
  const shouldShowNextButton = () => {
    const currentField = getCurrentField();
    if (!currentField) {
      console.error('Current field is null');
      return false;
    }
  
    // Visa inte knappen om fältet är klickbart
    return !currentField.isClickable;
  };
  
   // Sätt fokus på det aktuella fältet vid stegladdning
   useEffect(() => {
    const currentField = getCurrentField();
    if (currentField) {
      setFocus(currentField.name); // Sätter fokus på fältets namn
    }
  }, [currentStep, setFocus]); // Kör om currentStep ändras

  
  

  useEffect(() => {
    const generateAndEnhanceSummary = async () => {
      if (currentStep === selectedConfig.fields.length + 1) {
        const staticSummary = generateStaticSummary(formData); // Generera statisk text
        const enhancedSummary = await enhanceSummary(staticSummary); // Förbättra texten
        setSummary(enhancedSummary); // Uppdatera summary state
      }
    };

    generateAndEnhanceSummary();
  }, [currentStep, formData, selectedConfig.fields]);

  const generateStaticSummary = (formData) => {
    const parts = [];

    parts.push(`Du har valt att skapa en ${bookType === "audiobook" ? "ljudbok" : bookType === "pdf" ? "bok" : "bok och ljudbok"} vars hjälte är ${formData.name || "ett barn utan namn"}`);
    if (formData.age) parts.push(`, en ${formData.age} år gammal`);
    parts.push(formData.childGender || "person");
    parts.push(".");
    if (formData.theme) parts.push(`på temat ${formData.theme}.`);
    if (formData.interests) parts.push(`${formData.name || "Barnet"} gillar att ${formData.interests}.`);
    if (formData.friends) parts.push(`${formData.name || "Barnet"} har vänner som heter ${formData.friends}.`);
    if (formData.siblings) parts.push(`Syskonen heter ${formData.siblings}.`);
    if (formData.parents) parts.push(`Föräldrarna heter ${formData.parents}.`);
    if (formData.grandparents) parts.push(`Mor- och farföräldrarna är ${formData.grandparents}.`);
    if (formData.favoritePlace) {parts.push(`En av ${formData.name || "barnets"} favoritplatser är ${formData.favoritePlace}.`);}
    if (formData.siblings) parts.push(`Känslan i berättelsen är ${formData.mood}.`);  
    if (formData.favoriteAnimal) parts.push(`Favoritdjuret är en ${formData.favoriteAnimal}.`);
    if (formData.city) parts.push(`${formData.name || "Barnet"} bor i ${formData.city}.`);
    if (selectedStyle && bookType !== "audiobook") parts.push(`Illustrationsstilen är ${selectedStyle}.`);

    return parts.join(" ");
  };


  // Slumpa avatarer beroende på kön
  useEffect(() => {
    if (!selectedConfig.fields || !selectedConfig.fields[currentStep]) return;
  
    const childGender = formData.childGender; // Hämta kön direkt från formData
    const currentField = selectedConfig.fields[currentStep];
  
    if (currentField?.type === "select-avatar" && childGender) {
      const avatars = childGender === "tjej" ? femaleAvatars : maleAvatars;
      setRandomizedAvatars(shuffleArray(avatars));
    }
  }, [currentStep, formData.childGender, selectedConfig.fields, maleAvatars, femaleAvatars]);
  

  useEffect(() => {
    // När currentStep ändras, återställ inputfältet med sparad data eller tom sträng
    const currentField = selectedConfig.fields[currentStep];
    if (currentField) {
      const savedValue = formData[currentField.name] || "";
      setValue(currentField.name, savedValue);
    }
  }, [currentStep, selectedConfig.fields, formData, setValue]);

  const handleNext = async () => {
    const currentField = getCurrentField();
  
    if (currentField) {
      const validationRules = {
        required: currentField.required ? `${currentField.label} Detta är obligatoriskt` : false,
      };
  
      
  
      // Registrera och validera fältet
      register(currentField.name, validationRules);
      const isValid = await trigger(currentField.name);
  
      if (!isValid) {
        console.log(`Validation failed for field: ${currentField.name}`);
        return; // Stoppa om valideringen misslyckas
      }
    }
  
    // Spara aktuella värden och gå till nästa steg
    const stepData = getValues();
    setFormData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((prevStep) => prevStep + 1);
  };
  


// Hämta credits från API
const fetchCredits = async (userId) => {
    try {
      console.log("Hämtar credits för användar-ID:", userId);
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

   // Hämta användarens credits vid laddning av formuläret
   useEffect(() => {
    const fetchUserCredits = async () => {
      if (!currentUser || !currentUser.id) {
        console.error("currentUser saknar attribut 'sub'");
        return;
      }

      const userId = currentUser.id;
      const credits = await fetchCredits(userId);
      setCredits(credits); // Uppdatera lokalt state
    };

    if (currentUser) {
      fetchUserCredits();
    }
  }, [currentUser]);

  const handleCreditsValidation = (value) => {
    console.log("Validerar credits:", credits);
    if (!credits) {
      return "Kan inte validera krediter. Försök igen senare.";
    }
    if (value > credits) {
      return `Du har endast ${credits} krediter. Ange ett lägre antal.`;
    }
    if (value < 10) {
      return "Minsta tillåtna antal krediter är 10.";
    }
    return true; // Valid
  };
  
  useEffect(() => {
    const currentField = getCurrentField();
    if (currentField && currentField.type === "number") {
      console.log("Now on credits field.");
    }
  }, [currentStep]);
  useEffect(() => {
    console.log("Current Step:", currentStep);
    console.log("Current Field:", getCurrentField());
    console.log("Form Data:", formData);
  }, [currentStep, formData]);
  console.log("UserContext credits:", credits);

  useEffect(() => {
    console.log("Male avatars:", maleAvatars);
    console.log("Female avatars:", femaleAvatars);
  }, []);
  
  

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
    }
  };

  const handleFormSubmit = async () => {
    if (!currentUser) {
      setStatusMessage('Användar-ID saknas. Logga in och försök igen.');
      return;
    }
  
    setLoading(true);
    setStatusMessage('Skapar din bok...');
    console.log("Namn som skickas:", formData.name);

    try {
      // Kombinera all relevant data i en JSON-struktur
      const dataToSubmit = {
        ...formData, // Innehåller användarens inmatade värden
        user_id: currentUser.id, // Lägg till användarens ID
        bookType: bookType, // Vald boktyp
        avatar: formData.avatar, // Vald avatar
        style: selectedStyle, // Vald stil
        theme: formData.theme,
        category: selectedCategory,
        mood: formData.mood,
        credits: formData.credits,
        staticSummary: generateStaticSummary(formData), // Genererad statisk sammanfattning
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
      console.log('Response data:', data);
  
      if (data.remaining_credits !== undefined) {
        updateCredits(data.remaining_credits);
      }
      addNotification(`Din bok "${formData.name}" är klar!`);
  
      setLoading(false);
      setStatusMessage('Boken skapades framgångsrikt!');
    } catch (error) {
      setStatusMessage('Ett fel inträffade: ' + error.message);
      console.error('Error creating book:', error);
      setLoading(false);
    }
  };
  

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setCurrentStep(currentStep + 1); // Gå till sammanfattningen
  };

  const enhanceSummary = async (staticText) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/enhance-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ static_text: staticText }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte förbättra texten.");
      }

      const data = await response.json();
      return data.enhanced_text;
    } catch (error) {
      console.error("Fel vid förbättring av text:", error);
      return staticText; // Återgå till originaltexten om det misslyckas
    } finally {
      setLoading(false);
    }
  };
  
  
  
  return (
    <div className="p-6 w-full mx-auto bg-gradient-to-b from-white to-white rounded-xl ">
    {/* Översta sektionen */}
    <section className="text-center mb-8">
  <div className="text-black text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
    {selectedConfig.title}
  </div>
</section>


    {/* Tvåkolumnssektionen */}
    {showWelcome && (
      <section className="max-w-7xl mx-auto mt-8 mb-8 min-h-8xl">
        {/* Section above */}
        <div className="mb-8 text-center text-2xl">
          {(selectedConfig.textLeftTop || '').split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-charcoalGray mb-4 font-quicksand">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Two-column layout */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-12">
      <div>
        {/* Text Left */}
        {(selectedConfig.textLeft || '').split('\n\n').map((paragraph, index) => (
          <p key={index} className="text-charcoalGray mb-4 text-xl">
            {paragraph}
          </p>
        ))}

        {/* Subtitle */}
        {selectedConfig.textLeftSub && (
          <h3 className="text-turquoise mb-6 text-2xl font-bold">
            {selectedConfig.textLeftSub}
          </h3>
        )}
        {(selectedConfig.textLeftBottomB || '').split('\n\n').map((paragraph, index) => (
          <p key={index} className="text-charcoalGray mb-4 text-xl">
            {paragraph}
          </p>
        ))}
       
            {/* SKAPA BOK KNAPP HÄR!!!! */}
            <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-turquoise hover:bg-turquoise text-white font-semibold px-8 py-4 rounded-full transform transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
            >
            <Sparkles className="w-5 h-5 mr-2" />
            Skapa Bok
          </button>
        </div>

          </div>
          <div className="flex items-center justify-center h-full">
  <img
    src={selectedConfig.imageRight}
    alt="Children's Books"
    className="rounded-lg shadow-xl object-cover h-85 w-4/5"
  />
</div>

        </div>
      </section>
    )}

       {/* Formulärsektionen */}
    {!showWelcome && (
      <div
      className="p-6 sm:p-8 bg-lightLavender rounded-lg shadow-lg w-full sm:w-[55rem] min-h-[45rem] mx-auto flex flex-col justify-center items-center"
      style={{
        backgroundImage: `url(${epicbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Frågeformulär */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Val av boktyp */}
        {currentStep === 0 && (
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl text-charcoalGray font-bold mb-4 sm:mb-6">
              Vad vill du skapa?
            </h3>
            <h3 className="text-xl sm:text-2xl text-charcoalGray mb-4 sm:mb-6">
              Här kan du välja vilket format du vill skapa din bok i.
            </h3>
    
            {/* Anpassar layouten för mobil och större skärmar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {bookOptions.map((option) => (
                <div
                  key={option.key}
                  className="cursor-pointer rounded-lg p-1"
                  onClick={() => handleBookTypeSelect(option.key)}
                >
                  <div className="w-full aspect-square transform hover:scale-110 transition-transform duration-300 shadow-lg">
                    <img
                      src={option.image}
                      alt={option.name}
                      className="w-[8rem] sm:w-[12rem] h-auto object-cover rounded-t-lg"
                    />
                    <div className="bg-lightLavender text-charcoalGray text-center py-2 rounded-b-lg">
                      {option.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

            {/* Rendera övriga fält */}
          {selectedConfig.fields.map((field, index) => {
            if (index === currentStep - 1) {
              // Justera index för att börja efter boktypsvalet
              return (
                <div key={field.name} className="text-center mb-8">
                  <label htmlFor={field.name} className="block text-2xl font-semibold text-charcoalGray mb-6">
                    {field.label}
                  </label>
                  {field.subLabel && (
                    <p className="text-charcoalGray text-sm mb-4">{field.subLabel}</p>
                  )}
                  {/* Textfält */}
                  {field.type === 'text' && (
                    <div>
                      <input
                        {...register(field.name)}

                        type="text"
                        id={field.name}
                        placeholder={field.placeholder}
                        className={`
                          w-96 px-4 py-3 
                          border rounded-md shadow-sm focus:ring-0 focus:outline-none
                          ${errors[field.name] 
                            ? 'border-white focus:border-black' 
                            : 'border-softGray focus:border-turquoise'
                          }
                        `}
                      />
                      {errors[field.name] && (
                        <p className="text-black text-sm mt-2">
                          {errors[field.name].message}
                        </p>
                      )}
                    </div>
                  )}

           {/* Val av kön */}
{field.type === 'select-gender' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-center">
    {field.options.map((option) => (
      <div
        key={option.value}
        className={`cursor-pointer flex flex-col items-center ${
          formData.childGender === option.value ? 'border-4 border-turquoise' : 'border-2 border-transparent'
        } rounded-lg p-2 transition-all duration-300`}
        onClick={() => {
          const selectedGender = option.value;
          setValue(field.name, selectedGender);
          setFormData((prev) => ({ ...prev, [field.name]: selectedGender }));
          handleNext(); // Gå till nästa steg
        }}
      >
        <div className="w-full aspect-w-1 aspect-h-1 hover:scale-105 transition-transform duration-300 shadow-lg rounded-lg overflow-hidden">
          <img
            src={option.image}
            alt={option.value}
            className="w-[10rem] sm:w-[14rem] h-auto object-cover"
          />
        </div>
        <div className="bg-lavenderPurple text-white text-center py-2 w-full rounded-b-lg text-sm sm:text-base font-semibold">
          {option.value}
        </div>
      </div>
    ))}
  </div>
)}




{/* Val av ljudbokslängd */}
{field.type === 'select-length' && (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
    {field.options.map((option, lengthIndex) => (
      <div
        key={lengthIndex}
        className={`cursor-pointer transition-all duration-300 ${
          getValues(field.name) === option.tokens ? "border-4 border-turquoise shadow-lg scale-105" : "border-2 border-transparent"
        }`}
        onClick={() => {
          console.log(`Längd vald: ${option.name}`);
          setValue(field.name, option.tokens); // Spara tokens för längden
          setFormData((prev) => ({
            ...prev,
            [field.name]: option.tokens,
            credits: option.credits, // Uppdatera krediter
          }));

          // Gå till nästa steg efter val
          setCurrentStep((prevStep) => prevStep + 1);
        }}
      >
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <img
            src={option.src}
            alt={option.name}
            className="w-full h-auto max-w-[12rem] sm:max-w-[14rem] min-h-[14rem] sm:min-h-[12rem] object-cover mx-auto"
          />
        </div>

        <div className="bg-turquoise text-white text-center py-3 w-full rounded-b-lg text-base sm:text-lg font-semibold">
          {option.name}
        </div>
      </div>
    ))}
  </div>
)}






      {/* Val av uppläsare */}
{field.type === 'select-narrator' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
    {field.options.map((option, narratorIndex) => (
      <div
        key={narratorIndex}
        className={`cursor-pointer transition-all duration-300 ${
          getValues(field.name) === option.src ? "border-4 border-turquoise shadow-lg scale-105" : "border-2 border-transparent"
        }`}
        onClick={() => {
          console.log(`Narrator selected: ${option.name}`);
          setValue(field.name, option.src);
          setFormData((prev) => ({ ...prev, [field.name]: option.src }));
        
          // Gå till nästa steg efter val
          setCurrentStep((prevStep) => prevStep + 1);
        }}
      >
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <img
            src={option.src}
            alt={option.name}
            className="w-full h-auto max-w-[12rem] sm:max-w-[14rem] min-h-[14rem] sm:min-h-[12rem] object-cover mx-auto"
          />
        </div>

        <div className="bg-turquoise text-white text-center py-3 w-full rounded-b-lg text-base sm:text-lg font-semibold">
          {option.name}
        </div>
      </div>
    ))}
  </div>
)}


  {/* Val av avatar */}
{field.type === 'select-avatar' && index === currentStep - 1 && (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-center">
    {randomizedAvatars.map((avatar, avatarIndex) => (
      <div
        key={avatarIndex}
        className={`cursor-pointer flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
          getValues(field.name) === avatar.src ? 'border-4 border-turquoise' : 'border-2 border-transparent'
        }`}
        onClick={() => {
          console.log("Avatar selected:", avatar.src); // Log the avatar source
          setValue(field.name, avatar.src); // Save avatar source in formState
          setFormData((prev) => ({ 
            ...prev, 
            avatar: avatar.src, // Update avatar in formData
            avatarName: avatar.name // Optionally save the avatar name as well
          })); 
          setCurrentStep((prevStep) => prevStep + 1); // Move to next step
        }}
      >
        <div className="w-full aspect-w-1 aspect-h-1 hover:scale-105 transition-transform duration-300 shadow-lg rounded-lg overflow-hidden">
          <img
            src={avatar.src}
            alt={avatar.name}
            className="w-[8rem] md:w-[10rem] lg:w-[12rem] h-auto object-cover"
          />
        </div>
        <div className="bg-turquoise text-white text-center py-2 w-full rounded-b-lg text-sm md:text-base font-semibold">
          {avatar.name}
        </div>
      </div>
    ))}
  </div>
)}





                    {/* Stilval */}
                    {field.type === 'select-style' && (
                      <div className="grid grid-cols-2 gap-6">
                        {styles.map((style) => (
                          <div
                            key={style.key}
                            className={`cursor-pointer rounded-lg p-4 ${
                              selectedStyle === style.key ? 'border-blue-500 shadow-md' : ''
                            }`}
                            onClick={() => handleStyleSelect(style.key)}
                          >
                            <div className="aspect-w-1 aspect-h-1 hover:scale-105 transition-transform duration-300 shadow-lg rounded-b-lg">
                              <img
                                src={style.image}
                                alt={style.name}
                                className="w-[12rem] h-auto object-cover rounded-t-lg"
                              />
                              <div className="bg-turquoise text-white text-center py-2 rounded-b-lg">
                                {style.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}


                    
                  </div>
                );
              }
              return null;
            })}


{/* Sammanfattning */}
{currentStep === selectedConfig.fields.length + 1 && (
  <div className="text-center">
    {showOverlay ? (
      // Overlayen som visas under laddningen
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="relative text-white text-4xl font-bold tracking-wider">
          <span className="text-animation">Skapar Magi...</span>
        </div>
      </div>
    ) : (
      <>
        <h3 className="text-2xl text-gray-700 font-bold mb-6">Sammanfattning av din bok</h3>
        <p className="bg-white bg-opacity-60 mb-4 text-lg text-gray-900 p-3 rounded-xl shadow-lg">
        {summary
  ? summary
      .split(/\n\n|\.\s+/) // Dela vid stycken eller punkter
      .map((sentence, index) => (
        <p key={index} className="mb-4">{sentence.trim()}.</p>
      ))
  : <p>Genererar sammanfattning...</p>}
</p>
        <button
          type="button"
          onClick={handleFormSubmit}
          className="bg-turquoise hover:bg-turquoise text-white text-lg font-semibold px-8 py-4 rounded-full transform transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
        ><Sparkles className="w-4 h-4 mr-2" />
          Skapa boken
        </button>
        <p
          className="mt-4 text-base text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={() => {
            setCurrentStep(0); // Återställ stegen
            setFormData({}); // Nollställ formulärdata
            setShowWelcome(true); // Visa välkomstsekärmen
            setSelectedStyle(""); // Nollställ stilvalet
            setBookType(""); // Nollställ boktypen
            setSummary(""); // Nollställ sammanfattningen
          }}
        >
          Börja om
        </p>
      </>
    )}
  </div>
)}

{/* Navigeringsknappar */}
{!showOverlay && (
  <div className="mt-6 text-center">
    {/* Visa "Next"-knappen endast om shouldShowNextButton returnerar true */}
    {currentStep < selectedConfig.fields.length &&
      shouldShowNextButton() && ( // Använd funktionen här
        <button
          type="button"
          onClick={handleNext} // Kör handleNext med validering
          className="bg-turquoise hover:bg-turquoise text-white text-lg font-semibold px-8 py-4 rounded-full transform transition-all hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
        > 
          Fortsätt 
        </button>
      )}
    {/* Visa inte "Back" i sammanfattningen */}
    {currentStep > 0 && currentStep <= selectedConfig.fields.length && (
      <p
        onClick={handlePrevious}
        className="mt-4 text-sm text-gray-500 cursor-pointer hover:text-gray-700"
      >
        Tillbaka
      </p>
    )}
  </div>
)}






          </form>
        </div>
      )}

      {/* Section below */}
      {showBottomText && (
        <div className="mt-20 text-center text-2xl">
          {(selectedConfig.textLeftBottom || "").split("\n\n").map((paragraph, index) => (
            <p key={index} className="text-charcoalGray font-bold mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      
    </div>
  );
};

export default Form;
