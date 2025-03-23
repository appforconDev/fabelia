import React from "react";

export const StaticSummary = ({ data, onBack, onSubmit }) => {
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

  const summary = generateStaticSummary(data);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">Sammanfattning av din bok</h2>
      <p className="text-lg text-gray-700 mb-6">{summary}</p>
    
    </div>
  );
};
