// src/components/AudioPlayer.js
import React from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ audioUrl, title }) => {
  // Funktion för att rensa titel för filnamn
  const sanitizeFilename = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  };

  const filename = sanitizeFilename(title) || 'audiobook';
  const audioFilename = audioUrl.split('/').pop(); // Extrahera filnamnet från URL

  return (
    <div className="audio-player-container">
      <h2>{title}</h2>
      <audio controls>
        <source src={audioUrl} type="audio/mpeg" />
        Din webbläsare stödjer inte ljuduppspelning.
      </audio>
      <br />
      <a 
        href={`http://localhost:5000/download-audio/${audioFilename}?title=${encodeURIComponent(title)}`} 
        download={`${filename}.mp3`}  // Lägg till download-attributet
      >
        <button>Ladda ner</button>
      </a>
    </div>
  );
};

export default AudioPlayer;
