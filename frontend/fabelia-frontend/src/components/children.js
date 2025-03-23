

export const ChildConfig = {
    

  title: "Skapa Magiska Berättelser för Ditt Barn",
  textTop: "Ge liv åt deras fantasi med personliga äventyr där de själva är hjältarna – med sina vänner och sin hemstad.",
  textLeftTop: `Att skapa en magisk och oförglömlig berättelse för ditt barn är enklare än någonsin!\n\n
                Föreställ dig glädjen i ditt barns ögon när de hör en berättelse där de är hjälten, deras bästa vänner är med på äventyret och välkända platser från deras vardag får liv i historien.\n\n`,
  textLeft: `Här kan du skapa personliga böcker som väcker kreativitet, nyfikenhet och kärlek till berättelser. Börja enkelt med att lägga till ditt barns namn, välja vänner eller familjemedlemmar att inkludera, och välj platser som betyder något – som lekplatsen, skolan eller favoritkaféet.\n\n
                 \n\n`,
  textLeftSub: "Varför älskar barn personliga berättelser?",
  textLeftBottomB: `Studier visar att barn blir mer engagerade när de ser sig själva i en berättelse. Att höra sitt namn i en saga stärker självförtroendet, gör läsningen roligare och skapar en starkare koppling mellan berättaren och lyssnaren.\n\n
                Oavsett om det handlar om riddare och drakar, rymdäventyrare på nya planeter eller en mysig godnattsaga om vänskap, är dessa böcker skapade för att få varje barn att känna sig speciell. \n\nSjälva handlingen blir mer levande när barnet känner igen sig i karaktärerna och miljöerna, vilket gör att berättelsen stannar kvar längre i deras minne. Dessa personliga sagor är inte bara underhållande, utan också ett kraftfullt verktyg för att främja barnets kreativitet och språkutveckling.`,
  
  textLeftBottom: `Och det bästa? Du kan anpassa historien för att inkludera de platser och personer som betyder mest för dem.\n\n
                Varför inte skapa en berättelse som inte bara underhåller utan också inspirerar och stärker relationer?`,
  imageRight: "/images/fabelia_omslag.webp",
  textBottom: "Gör sagostunden oförglömlig med en bok där ditt barn och deras värld står i centrum. Perfekt för födelsedagar, högtider eller bara för att sprida glädje.",
  maleAvatars: [
      { src: '/images/male1.webp', name: 'Äventyraren' },
      { src: '/images/male2.webp', name: 'Utforskaren' },
      { src: '/images/male3.webp', name: 'Hjälten' },
      { src: '/images/male4.webp', name: 'Filosofen' },
      { src: '/images/male5.webp', name: 'Upptäckaren' },
      { src: '/images/male6.webp', name: 'Tänkaren' },
      { src: '/images/male7.webp', name: 'Kämpen' },
      { src: '/images/male8.webp', name: 'Drömmaren' },
    ],
    femaleAvatars: [
      { src: '/images/female1.webp', name: 'Prinsessan' },
      { src: '/images/female2.webp', name: 'Äventyraren' },
      { src: '/images/female3.webp', name: 'Hjälten' },
      { src: '/images/female4.webp', name: 'Upptäckaren' },
      { src: '/images/female5.webp', name: 'Filosofen' },
      { src: '/images/female6.webp', name: 'Utforskaren' },
      { src: '/images/female7.webp', name: 'Kämpen' },
      { src: '/images/female8.webp', name: 'Drömmaren' },
    ],
    styles: [
      {
        key: "pixar",
        name: "Pixar",
        image: "/images/female6.webp",
      },
      {
        key: "simpsons",
        name: "Simpsons",
        image: "/images/styles/ghibli_style.jpg",
      },
      {
        key: "disney",
        name: "Disney",
        image: "/images/styles/disney_style.jpg",
      },
      {
        key: "realistic",
        name: "Realistisk",
        image: "/images/styles/realistic_style.jpg",
      },
    ],
    fields: [
      { name: "name", label: "Vad heter barnet?", type: "text", placeholder: "Barnets namn", required: true},
      { name: "age", label: "Hur gammal är barnet?", type: "text", placeholder: "Ålder" },
      {
        name: "childGender",
        label: "Barnets kön?",
        type: "select-gender",
        options: [
          { value: "kille", image: "/images/pojke.webp" },
          { value: "tjej", image: "/images/flicka.webp" }, 
        ], isClickable: true,
      },
      { name: "theme", label: "Välj ett tema för berättelsen", type: "text", placeholder: "ex Jul, Sommaräventyr, Mystiskt, Pirat, Detektiv" },
     
      { name: "mood", label: "Vilken känsla ska speglas i storyn", type: "text", placeholder: "ex Sorglig, Glad, Humoristisk, Avslappnad, Spännande" },
     
      { name: "interests", label: "Vad är barnets intressen?", type: "text", placeholder: "Hoppa rep, Klättra" },
      { name: "friends", label: "Vad heter barnets vänner?", type: "text", placeholder: "Mats, Sara" },
      {
        name: "favoritePlace",
        label: "Favoritplats",
        subLabel: "Skriv barnets favoritplats, t.ex. biblioteket eller fotbollsplanen.",
        type: "text",
        placeholder: "Biblioteket eller fotbollsplanen"
      },
      
      { name: "siblings", label: "Vad heter barnets syskon?", type: "text", placeholder: "Philip, Elicia" },
      { name: "parents", label: "Vad heter barnets föräldrar?", type: "text", placeholder: "Förälder/Föräldrar" },
      { name: "grandparents", label: "Vad heter barnets far/mor-föräldrar?", type: "text", placeholder: "Far/Mor-föräldrar" },
      { name: "favoriteAnimal", label: "Vad är barnets favoritdjur?", type: "text", placeholder: "Elefant" },
      { name: "city", label: "I vilken stad bor barnet?", type: "text", placeholder: "Stad" },
      { name: "avatar", label: "Välj en avatar", type: "select-avatar", isClickable: true, },
      { name: "style", label: "Välj en stil för illustrationerna", type: "select-style", options: ["Pixar", "Disney", "Realistisk"], isClickable: true, },
      { 
        name: "audioLength", 
        label: "Välj längd för ljudboken", 
        subLabel: "Välj mellan tre olika längder för din ljudbok.", 
        type: "select-length", 
        options: [
          { src: '/images/10min.jpg', name: '10-12 minuter (200 krediter)', credits: 200, tokens: 5000 },
          { src: '/images/20min.jpg', name: '20-25 minuter (400 krediter)', credits: 400, tokens: 9000 },
          { src: '/images/30min.jpg', name: '30-40 minuter (600 krediter)', credits: 600, tokens: 14000 },
        ], 
        isClickable: true,
      },
      
      { 
        name: "narrator", 
        label: "Välj en uppläsare", 
        subLabel: "Välj en röst för din ljudbok.", 
        type: "select-narrator", 
        options: [
          { src: '/images/female1.jpg', name: 'Ebba Busch' },
          { src: '/images/male2.jpg', name: 'Burt Reynolds' },
        ], isClickable: true,
      },
    ],
  };
  