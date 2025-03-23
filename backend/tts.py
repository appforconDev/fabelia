import time
import os
import uuid
from datetime import datetime
from pydub import AudioSegment
import logging
import random
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from dotenv import load_dotenv  # Importera dotenv

# Ladda miljövariabler från .env
load_dotenv()

# Konfigurera logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lista över tillgängliga ljudfiler för bakgrundsmusik
sound_files = [
    "sounds/1.mp3",
    "sounds/2.mp3",
    "sounds/3.mp3",
    "sounds/4.mp3",
    "sounds/5.mp3",
    "sounds/6.mp3",
    "sounds/7.mp3",
    "sounds/8.mp3",
    "sounds/9.mp3",
    "sounds/10.mp3",
    "sounds/11.mp3",
    "sounds/12.mp3"
]

def generate_unique_filename(base_name, extension):
    """
    Genererar ett unikt filnamn baserat på tidsstämpel och UUID.
    Exempel: "tts_audio_20250213_123456_abcd1234.mp3"
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = uuid.uuid4().hex[:8]  # Tar endast de första 8 tecknen för att hålla det kort
    return f"{base_name}_{timestamp}_{unique_id}.{extension}"

class AudioMixer:
    def __init__(self, sound_files):
        self.sound_files = sound_files
        self.polly_client = boto3.client(
            'polly',
            region_name=os.getenv('AWS_REGION'),  # Region från .env
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )

    def create_audio_with_polly(self, text, language):
        """
        Skapar ett ljudklipp med Amazon Polly genom att dela upp texten i bitar under 3000 tecken.
        """
        try:
            voice_id = 'Elin'
            max_length = 3000
            audio_segments = []

            # Dela texten i bitar under 3000 tecken
            parts = [text[i:i+max_length] for i in range(0, len(text), max_length)]

            for i, part in enumerate(parts):
                response = self.polly_client.synthesize_speech(
                    Text=part,
                    OutputFormat='mp3',
                    VoiceId=voice_id,
                    Engine='neural'
                )

                # Skapa en unik fil för varje del
                part_audio_path = generate_unique_filename("temp_part", "mp3")
                with open(part_audio_path, 'wb') as audio_file:
                    audio_file.write(response['AudioStream'].read())

                audio_segments.append(AudioSegment.from_file(part_audio_path))
                os.remove(part_audio_path)

            # Kombinera alla delar
            combined_audio = sum(audio_segments)

            # Lägg till 5 sekunders tystnad
            end_padding = AudioSegment.silent(duration=5000)  # 5 sekunders tystnad
            extended_audio = combined_audio + end_padding

            # Spara den kombinerade ljudfilen med ett unikt namn
            extended_audio_path = generate_unique_filename("tts_audio", "mp3")
            extended_audio.export(extended_audio_path, format="mp3")

            logger.info(f"✅ TTS-ljudfil skapad: {extended_audio_path}")
            return extended_audio_path

        except (NoCredentialsError, PartialCredentialsError):
            logger.error("❌ AWS-autentisering misslyckades. Kontrollera dina AWS-uppgifter.")
            return None
        except Exception as e:
            logger.error(f"❌ Fel vid skapande av Polly TTS-ljud: {e}")
            return None

    def add_background_music(self, audio_path, output_dir=None):
        """
        Lägg till bakgrundsmusik till ett ljudspår.
        """
        try:
            if not audio_path:
                return None

            # Välj slumpmässig bakgrundsmusik
            current_background_music = random.choice(self.sound_files)
            final_audio_filename = generate_unique_filename("final_audio_with_music", "mp3")

            # Bestäm utgångskatalog och sökväg
            if output_dir:
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                final_audio_path = os.path.join(output_dir, final_audio_filename)
            else:
                final_audio_path = f"./{final_audio_filename}"

            # Ladda ljudfiler
            narration_audio = AudioSegment.from_file(audio_path)
            background_music = AudioSegment.from_file(current_background_music)

            # Sänk volymen på bakgrundsmusiken med 17 dB
            background_music = background_music.apply_gain(-17)

            # Längden på berättelsen
            narration_length = len(narration_audio)

            # Totalt behövd längd på bakgrundsmusik = berättelselängd + 10 sek (5 sek före + 5 sek efter)
            required_music_length = narration_length + 10000  # 10 000 ms = 10 sek

            # Loopa bakgrundsmusiken för att få den tillräckligt lång
            looped_background_music = background_music * (required_music_length // len(background_music) + 1)
            background_full = looped_background_music[:required_music_length]

            # Lägg till fade in på de första 2 sek och fade out på de sista 4 sek
            background_full = background_full.fade_in(2000).fade_out(4000)

            # Overlay berättelsen 5 sek in i bakgrundsmusiken
            final_audio = background_full.overlay(narration_audio, position=5000)

            # Exportera den kombinerade ljudfilen
            final_audio.export(final_audio_path, format="mp3")
            logger.info(f"✅ Kombinerad ljudfil med musik skapad: {final_audio_path}")

            return final_audio_path

        except Exception as e:
            logger.error(f"❌ Fel vid tillägg av bakgrundsljud: {e}", exc_info=True)
            return audio_path


# Exempel på användning
if __name__ == "__main__":
    mixer = AudioMixer(sound_files)
    text = "Det här är en testberättelse för att verifiera ljudmixning med Amazon Polly."
    tts_audio = mixer.create_audio_with_polly(text, language='sv')
    if tts_audio:
        final_audio = mixer.add_background_music(tts_audio, output_dir="./static/audio")
