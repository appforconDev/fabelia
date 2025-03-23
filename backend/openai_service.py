import os
import logging
import time
from openai import OpenAI
import openai
import re
import json
from dotenv import load_dotenv
from pdf_generator import download_image
import http.client
from pdf_generator import generate_pdf
import requests
from deep_translator import GoogleTranslator
import uuid 
from typing import Optional, Dict, Any
import random 
from save_cover_locally_and_generate_pdf import get_book_image_dir

# Sätt upp logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)  # Justera efter behov

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

# Definiera basmappen för projektet
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_IMAGE_DIR = os.path.join(BASE_DIR, "temp_images")
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)  # Skapa mappen om den inte finns

# Skapa katalog för PDF-filer
PDF_DIR = os.path.join(BASE_DIR, "pdf_books")
os.makedirs(PDF_DIR, exist_ok=True)

# Initiera OpenAI klienten
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# Hitta sökvägen till avatars.json
current_dir = os.path.dirname(__file__)  # Katalogen där app.py finns
avatars_path = os.path.join(current_dir, "avatars.json")

# Läs in avatarbeskrivningar från JSON
try:
    with open(avatars_path, "r", encoding="utf-8") as file:
        avatars_data = json.load(file)
        children_avatars = avatars_data.get("childrenAvatars", {})
except FileNotFoundError:
    logger.error(f"Filen {avatars_path} hittades inte.")
    children_avatars = {}
except json.JSONDecodeError as e:
    logger.error(f"Kunde inte läsa {avatars_path}: {e}")
    children_avatars = {}

def get_avatar_description(avatar_key):
    """
    Hämtar beskrivningen för en specifik avatar.
    """
    logger.info(f"🔍 Försöker hitta avatar-beskrivning för key: {avatar_key}")  # 🛠 Debug-logga

    # Se till att vi bara får själva nyckeln, t.ex. male8 istället för "/images/male8.webp"
    avatar_key = os.path.splitext(os.path.basename(avatar_key))[0]  

    for gender, avatars in children_avatars.items():
        for avatar in avatars:
            if avatar.get("id") == avatar_key:
                description = avatar.get("description", "Ett barn")
                logger.info(f"✅ Hittade avatar: {description}")  # 🛠 Debug-logga
                return description
    
    logger.warning(f"⚠️ Hittade ingen avatar för {avatar_key}, returnerar 'Ett barn'.")
    return "Ett barn"

AVATAR_SEEDS = {
    "male1": 6917250859,
    "male2": 552191790,
    "male3": 1939371909,
    "male4": 2017075262,
    "male5": 6425413110,
    "male6": 8758473418,
    "male7": 2140595684,
    "male8": 5510013069,
    "female1": 589590707,
    "female2": 2676434142,
    "female3": 8926663016,
    "female4": 1754798418,
    "female5": 6712007830,
    "female6": 2599862763,
    "female7": 2493555412,
    "female8": 3866688764
}




class LeonardoAPIError(Exception):
    """Custom exception för Leonardo API-relaterade fel"""
    pass
MODEL_ID = "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3"

def generate_some_image(prompt: str, avatar_key: Optional[str] = None, seed: Optional[int] = None) -> Optional[str]:
    """
    Genererar en bild med Leonardo AI och använder seed för konsekventa karaktärer.
    """
    try:
        leonardo_api_key = os.getenv("LEONARDO_API_KEY")
        if not leonardo_api_key:
            logger.error("❌ Leonardo API-nyckel saknas i .env-filen")
            return None

        # Begränsa seed-värdet till max tillåtet värde
        MAX_SEED = 2147483637
        if seed and seed > MAX_SEED:
            logger.warning(f"⚠️ Seed-värdet {seed} är för stort. Använder max tillåtet värde: {MAX_SEED}")
            seed = MAX_SEED

        if seed is None:
            seed = AVATAR_SEEDS.get(avatar_key, None)
        logger.info(f"🎲 Använder seed {seed} för avatar {avatar_key}")
        logger.info(f"✅ API KEY tillgänglig: {bool(leonardo_api_key)}")

        headers = {
            "Authorization": f"Bearer {leonardo_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "prompt": prompt,
            "modelId": MODEL_ID,
            "width": 1024,
            "height": 1024,
            "num_images": 1,
            "seed": seed
        }

        #logger.info(f"📤 Skickar request till Leonardo API med payload: {json.dumps(payload, indent=2)}")

        response = requests.post(
            "https://cloud.leonardo.ai/api/rest/v1/generations",
            headers=headers,
            json=payload
        )

        logger.info(f"📥 Fick response med status kod: {response.status_code}")
        logger.info(f"📥 Response headers: {dict(response.headers)}")

        response_data = response.json()
        logger.info(f"📥 Response body: {json.dumps(response_data, indent=2)}")

        if not response.ok:
            error_message = (
                response_data.get("error")
                if isinstance(response_data, dict)
                else str(response_data)
            )
            logger.error(f"❌ API fel: {error_message}")
            return None

        # Om vi har ett lyckat svar, hämta generationId
        if isinstance(response_data, dict) and "sdGenerationJob" in response_data:
            generation_id = response_data["sdGenerationJob"].get("generationId")
            if generation_id:
                logger.info(f"✅ Fick generationId: {generation_id}")
                image_url = wait_for_image_generation(generation_id, headers)
                if image_url:
                    logger.info(f"✅ Bild genererad: {image_url}")
                return image_url

        logger.error("❌ Kunde inte hitta generationId i API-svaret")
        return None

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Nätverksfel vid anrop till Leonardo API: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"❌ Kunde inte parsa API-svaret som JSON: {str(e)}")
        logger.error(f"❌ Rå response text: {response.text}")
        return None
    except Exception as e:
        logger.error(f"❌ Oväntat fel: {str(e)}")
        logger.exception("Detaljerad stack trace:")
        return None


def generate_cover_image(prompt: str, avatar_key: Optional[str] = None, seed: Optional[int] = None) -> Optional[str]:
    """
    Genererar en omslagsbild i porträttformat (1024x1792) med Leonardo AI.
    """
    try:
        leonardo_api_key = os.getenv("LEONARDO_API_KEY")
        if not leonardo_api_key:
            logger.error("❌ Leonardo API-nyckel saknas i .env-filen")
            return None

        MAX_SEED = 2147483637
        if seed and seed > MAX_SEED:
            logger.warning(f"⚠️ Seed-värdet {seed} är för stort. Använder max tillåtet värde: {MAX_SEED}")
            seed = MAX_SEED

        if seed is None:
            seed = AVATAR_SEEDS.get(avatar_key, None)
        logger.info(f"🎲 Använder seed {seed} för avatar {avatar_key}")

        headers = {
            "Authorization": f"Bearer {leonardo_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "prompt": prompt,
            "modelId": MODEL_ID,
            "width": 1024,  # PORTRAIT MODE
            "height": 1536,
            "num_images": 1,
            "seed": seed
        }

        logger.info(f"📤 Skickar request till Leonardo API för omslagsbild: {json.dumps(payload, indent=2)}")

        response = requests.post(
            "https://cloud.leonardo.ai/api/rest/v1/generations",
            headers=headers,
            json=payload
        )

        response_data = response.json()
        logger.info(f"📥 Response body: {json.dumps(response_data, indent=2)}")

        if not response.ok:
            error_message = response_data.get("error", str(response_data))
            logger.error(f"❌ API fel: {error_message}")
            return None

        if isinstance(response_data, dict) and "sdGenerationJob" in response_data:
            generation_id = response_data["sdGenerationJob"].get("generationId")
            if generation_id:
                logger.info(f"✅ Fick generationId: {generation_id}")
                image_url = wait_for_image_generation(generation_id, headers)
                if image_url:
                    logger.info(f"✅ Omslagsbild genererad: {image_url}")
                return image_url

        logger.error("❌ Kunde inte hitta generationId i API-svaret")
        return None

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Nätverksfel vid anrop till Leonardo API: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"❌ Kunde inte parsa API-svaret som JSON: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"❌ Oväntat fel: {str(e)}")
        return None



def wait_for_image_generation(generation_id: str, headers: Dict[str, str], timeout: int = 300) -> Optional[str]:
    """
    Väntar på att bilden ska genereras och returnerar bildens URL.
    """
    url = f"https://cloud.leonardo.ai/api/rest/v1/generations/{generation_id}"
    start_time = time.time()
    attempt = 0

    while time.time() - start_time < timeout:
        try:
            attempt += 1
            logger.info(f"🔄 Kontrollerar status (försök {attempt})...")

            response = requests.get(url, headers=headers)
            response.raise_for_status()

            data = response.json()
            #logger.info(f"📊 API Response: {json.dumps(data, indent=2)}")

            # Correctly extract the status from the nested structure
            status = data.get("generations_by_pk", {}).get("status")
            logger.info(f"📊 Status: {status}")

            if status == "COMPLETE":
                generations = data.get("generations_by_pk", {}).get("generated_images", [])
                if generations and len(generations) > 0:
                    image_url = generations[0].get("url")
                    if image_url:
                        return image_url
                logger.error("❌ Ingen bild-URL i det färdiga svaret")
                return None

            elif status == "FAILED":
                error = data.get("generations_by_pk", {}).get("error", "Okänt fel")
                logger.error(f"❌ Bildgenereringen misslyckades: {error}")
                return None

            elif status in ["PENDING", "PROCESSING"]:
                logger.info("⏳ Bildgenerering pågår...")

            time.sleep(5)

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Nätverksfel vid statuskontroll: {str(e)}")
            time.sleep(5)
            continue
        except json.JSONDecodeError as e:
            logger.error(f"❌ Kunde inte parsa API-svaret som JSON: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Oväntat fel vid statuskontroll: {str(e)}")
            logger.exception("Detaljerad stack trace:")
            return None

    logger.error("❌ Timeout: Bildgenereringen tog för lång tid")
    return None



def fetch_city_details(city):
    if not city:
        return ""

    # Bygg prompt för att få information om staden
    city_prompt = (
        f"Beskriv kort vad som kännetecknar {city}. Inkludera viktiga landmärken, historiska platser, "
        f"och andra intressanta fakta som kan passa för en berättelse."
    )

    try:
        try:
            # Första försöket med gpt-4o-mini
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": city_prompt}
                ],
                max_tokens=150
            )
        except Exception as e:
            logger.warning(f"Fel med gpt-4o-mini i fetch_city_details: {e}. Försöker med gpt-3.5-turbo.")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": city_prompt}
                ],
                max_tokens=150
            )
        
        city_details = response.choices[0].message.content.strip()
        return city_details
    except Exception as e:
        logger.error(f"Fel vid hämtning av stadsdetaljer: {e}")
        return ""


def calculate_max_tokens(credits, selected_length):
    """
    Beräknar maximalt antal tokens baserat på användarens credits.
    """
    try:
        credits = int(credits)  # Konvertera till int om det inte redan är det
    except ValueError:
        raise ValueError(f"Credits måste vara ett heltal, fick: {credits}")
    tokens_per_credit = {
    3500: 35,
    7000: 70,
    10000: 100
    }[selected_length]
 # Genomsnittligt antal tokens per credit
    return credits * tokens_per_credit



def generate_summary_text(story_text):
    prompt = (
        "Sammanfatta följande berättelse i en kort mening som kan användas som beskrivning för en omslagsbild: "
        f"{story_text}" 
    )


    try:
        try:
            # Första försöket med gpt-4o-mini
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
        except Exception as e:
            logger.warning(f"Fel med gpt-4o-mini i generate_summary_text: {e}. Försöker med gpt-3.5-turbo.")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Fel vid sammanfattning: {e}")
        return ""


def enhance_summary_text(static_text):
    """
    Förbättrar och kryddar en statisk sammanfattning med hjälp av GPT.
    """
    prompt = (
        "Förbättra och krydda följande text för att göra den mer intressant, "
        "levande och engagerande utan att ändra på den ursprungliga meningen eller informationen:\n\n"
        f"{static_text}"
    )
    
    try:
        try:
            # Första försöket med gpt-4o-mini
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.9  # Lägg till lite kreativitet
            )
        except Exception as e:
            logger.warning(f"Fel med gpt-4o-mini i enhance_summary_text: {e}. Försöker med gpt-3.5-turbo.")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.8  # Lägg till lite kreativitet
            )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Fel vid förbättring av text: {e}")
        return static_text  # Om det misslyckas, returnera den ursprungliga texten
    
def generate_concise_scene_description(scene_text):
    """
    Skapar en kortfattad, visuell beskrivning av scenen för bildgenerering.
    """

    concise_prompt = (
        f"Extract the key visual elements from the following scene description. "
        f"Only include the setting, characters, and the most important action, "
        f"without unnecessary details. Format the response as a clear and simple sentence.\n\n"
        f"Scene description: {scene_text}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": concise_prompt}],
            max_tokens=60
        )
        scene_summary = response.choices[0].message.content.strip()

        # 🔥 Säkerhetskontroll - om beskrivningen är irrelevant, sätt en fallback
        if any(word in scene_summary.lower() for word in ["error", "server", "message", "failure"]):
            logger.warning(f"⚠️ Felaktig scenbeskrivning upptäckt: {scene_summary}")
            scene_summary = "A beautiful landscape with exciting adventure."

        return scene_summary

    except Exception as e:
        logger.error(f"❌ Error generating concise scene description: {e}")
        return "A simple scene based on the story."



    
def generate_scene_images(scenes, avatar_key, style, book_folder):
    """
    Genererar bilder för varje scen och sparar dem i en unik bokmapp.
    """
    if not scenes:
        logger.error("🚨 Inga scener skickade till bildgenerering!")
        return []

    scene_images = []

    for scene in scenes:
        scene_number = scene.get("scene_number")
        if not scene_number:
            logger.warning(f"⚠️ Scen saknar scene_number: {scene}")
            continue

        if "scene_description" not in scene:
            logger.warning(f"⚠️ Scen {scene_number} saknar scene_description")
            continue

        try:
            # Översätt till engelska för bättre AI-generering
            translator = GoogleTranslator(source='auto', target='en')
            scene_description_en = translator.translate(scene['scene_description'])

            # Generera en kortfattad visuell beskrivning
            scene_summary = generate_concise_scene_description(scene_description_en)

            # Skapa prompt
            prompt = (
                f"A breathtakingly detailed illustration in a vibrant, Pixar-inspired style. "
                f"The scene should evoke a sense of wonder and excitement, with a dynamic background and engaging atmosphere. "
                f"Depict: {scene_summary}. "
                f"The main character ({get_avatar_description(avatar_key)}) is actively engaged in the scene , exploring, or interacting with the surroundings, with bright inquisitive eyes and a lively expression. "
                f"Ensure a balanced composition where the character is seamlessly integrated into the environment, surrounded by lush greenery, vibrant colors, and intricate details. "
                f"Use rich, bold lines and warm, golden lighting to enhance the mood and create depth and atmosphere. No text should appear in the image."
            )




            # Generera seed
            base_seed = AVATAR_SEEDS.get(avatar_key, random.randint(0, 2147483647))
            seed = base_seed + scene_number if base_seed else random.randint(0, 2147483647)

            # Generera bild
            image_url = generate_some_image(prompt, seed=seed)
            if not image_url:
                logger.error(f"⚠️ Kunde inte generera bild för scen {scene_number}")
                continue

            # Skapa filnamn och spara i rätt bokmapp
            unique_filename = f"scene_{scene_number}_{uuid.uuid4().hex}.png"
            downloaded_image_path = download_image(image_url, unique_filename, book_folder)  # 🔥 Skickar med book_folder

            if not downloaded_image_path:
                logger.error(f"⚠️ Kunde inte ladda ner bild för scen {scene_number}")
                continue

            # Lägg till i lista
            scene_images.append({
                "scene_number": scene_number,
                "image_path": downloaded_image_path,
                "image_url": image_url,
                "text": scene.get("scene_description", "")
            })

            logger.info(f"✅ Genererade och sparade bild för scen {scene_number}: {unique_filename}")

        except Exception as e:
            logger.error(f"🚨 Fel vid generering av bild för scen {scene_number}: {e}")
            continue

    logger.info(f"✅ Genererade totalt {len(scene_images)} scenbilder")
    return scene_images




def generate_short_summary(story_text, theme):
    """
    Generates a short, visually descriptive summary of the story in English.
    """

    logger.info(f"📢 Generating short summary with theme: {theme}")

    prompt = (
        f"Generate a visually descriptive short summary of the following story, ensuring that it matches the theme '{theme}'. "
        f"The summary should reflect the environment, setting, and atmosphere of the story, without adding unrelated elements.\n\n"
        f"Story:\n{story_text}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        short_summary = response.choices[0].message.content.strip()
        logger.info(f"✅ Generated short summary: {short_summary}")
        return short_summary
    except Exception as e:
        logger.error(f"❌ Error generating short summary: {e}")
        return f"A magical {theme} story set in a beautiful location."


def generate_safe_cover_prompt(short_summary, city_details, avatar_key):
    """
    Skapar en säker och modereringsvänlig omslagsprompt genom att korta ner och filtrera känsligt innehåll.
    """
    safety_prompt = (
        f"Rewrite the following book summary into a visually descriptive but safe AI prompt. "
        f"Ensure it is family-friendly and avoids any sensitive words. "
        f"Focus only on a cinematic setting, atmosphere, and main character interaction.\n\n"
        f"Original Summary: {short_summary}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": safety_prompt}],
            max_tokens=80
        )
        safe_prompt = response.choices[0].message.content.strip()

        if any(word in safe_prompt.lower() for word in ["error", "server", "moderation", "failure"]):
            logger.warning(f"⚠️ Felaktig säker omslagsprompt upptäckt: {safe_prompt}")
            safe_prompt = f"A magical adventure in {city_details} featuring {get_avatar_description(avatar_key)}."

        return safe_prompt

    except Exception as e:
        logger.error(f"❌ Fel vid generering av säker prompt: {e}")
        return f"A magical adventure in {city_details} featuring {get_avatar_description(avatar_key)}."

def generate_backside_image(theme, short_summary, city_details):
    """
    Genererar en baksidebild för boken baserat på temat, en kort sammanfattning och stadens detaljer.
    """
    prompt = (
        f"A breathtakingly detailed Pixar-style illustration of a {theme} setting, vividly capturing its unique and enchanting atmosphere. "
        f"The scene should visually embody the essence of the story, with a profound sense of depth and dynamism. "
        f"Focus on the {theme}-specific environment, using elements that beautifully reinforce this theme, such as lush greenery, vibrant colors, and intricate details. "
        f"Remove any unrelated elements that do not align with the theme, ensuring a cohesive and immersive scene.\n\n"
        f"Story setting:\n{short_summary}\n"
        f"No characters should appear in the image, only the environment. "
        f"Use warm, vibrant lighting and Pixar-style rich colors to enhance the sense of adventure and wonder. "
        f"No text should appear in the image."
    )


    logger.info(f"🎨 Leonardo Prompt for backside image: {prompt}")

    # 🔥 Skicka prompten för bildgenerering
    backside_image_url = generate_cover_image(prompt)

    # 🚨 Om allt misslyckas, använd en fallback-bild
    if not backside_image_url:
        logger.warning("❌ Backside image could not be generated. Using a default image.")
        backside_image_url = "https://example.com/default-backside.jpg"

    logger.info(f"✅ Backside image generated: {backside_image_url}")
    return backside_image_url


def sanitize_filename(filename):
    """
    Rensar filnamn från ogiltiga tecken och ersätter dem med '_'.
    """
    return re.sub(r'[<>:"/\\|?*]', '_', filename).strip()

def save_backside_image_locally(backside_image_url, title, book_folder):
    """
    Saves the backside image locally in the book's folder.
    """
    if not backside_image_url:
        logger.warning("⚠️ No backside image URL provided.")
        return None

    # Create filename for backside image - changing to match the filename used in save_cover_locally_and_generate_pdf
    backside_image_filename = f"{sanitize_filename(title)}_backside.png"
    backside_image_path = os.path.join(book_folder, backside_image_filename)

    try:
        response = requests.get(backside_image_url, stream=True)
        if response.status_code == 200:
            with open(backside_image_path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            logger.info(f"✅ Backside image saved locally: {backside_image_path}")
            return backside_image_path
        else:
            logger.warning(f"⚠️ Failed to download backside image, status code: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"⚠️ Error downloading backside image: {e}")
        return None

def skapa_omslagsbild(theme, avatar_key, short_summary, city_details):
    """
    Genererar en omslagsbild för boken baserat på temat, huvudkaraktären, en kort sammanfattning och stadens detaljer.
    """

    seed = AVATAR_SEEDS.get(avatar_key, None)
    logger.info(f"🎲 Använder seed {seed} för avatar {avatar_key} på omslaget")

    if not city_details:
        city_details = "a vibrant and lively cityscape"

    # Skapa primär prompt
    prompt = (
        f"A highly detailed Pixar-style illustration. The scene takes place in {city_details}, capturing its unique atmosphere. "
        f"The main character ({get_avatar_description(avatar_key)}) is naturally interacting with the environment, not centered. "
        f"Use warm, vibrant lighting and rich colors to enhance the sense of adventure in a cinematic feel. "
        f"The image should visually represent the story's essence: '{short_summary}', ensuring depth and dynamism. "
        f"No text should appear in the image."
    )

    logger.info(f"🎨 Leonardo Prompt: {prompt}")

    # 🔥 Skicka prompten för bildgenerering
    omslag_image_url = generate_cover_image(prompt, seed=seed)

    # 🔄 Om bilden blockeras av moderering, generera en säker prompt och försök igen
    if not omslag_image_url:
        logger.warning("⚠️ Leonardo AI blockerade bilden – försöker med en säker prompt.")

        safe_prompt = generate_safe_cover_prompt(short_summary, city_details, avatar_key)
        logger.info(f"🛡️ Säker omslagsprompt: {safe_prompt}")

        omslag_image_url = generate_cover_image(safe_prompt, seed=seed)

    # 🚨 Om allt misslyckas, använd en fallback-bild
    if not omslag_image_url:
        logger.warning("❌ Omslagsbilden kunde inte genereras. Använder en standardbild.")
        omslag_image_url = "https://example.com/default-cover.jpg"

    logger.info(f"✅ Omslagsbild genererad: {omslag_image_url}")
    return omslag_image_url



def generate_main_story_text(name, theme, data):
    """
    Huvudfunktion för att generera en sammanhängande berättelse med en röd tråd.
    """

    age = data.get('age', '7')
    city = data.get('city', '')
    credits = int(data.get('credits', 200))

    # 🔹 Bestäm antal kapitel baserat på credits
    num_chapters = {200: 3, 400: 6, 600: 11}.get(credits, 3)

    logger.info(f"📖 Genererar {num_chapters} kapitel för {name}.")

    # 🔹 Steg 1: Generera en sammanhängande berättelseplan
    story_outline = generate_story_outline(name, age, theme, city, num_chapters, data)

    # 🔹 Steg 2: Skapa en kapitelöversikt för att hålla röd tråd
    chapter_overview = generate_chapter_overview(story_outline, num_chapters)

    # 🔹 Steg 3: Generera berättelsen kapitel för kapitel
    return generate_story_chapters(name, theme, age, city, num_chapters, chapter_overview, data)


def generate_story_outline(name, age, theme, city, num_chapters, data):
    """
    Skapar en sammanhängande berättelseplan på engelska med tydlig början, mitt och slut.
    """

    city_details = fetch_city_details(city)
    mood = data.get('mood', 'happy')

    story_outline_prompt = (
        f"Create a structured story outline for a Swedish children's adventure story about {name}, a {age}-year-old "
        f"child in {city}. The theme is '{theme}', and the story should have a clear beginning, middle, and end. "
        f"The plot should develop across {num_chapters} chapters with a consistent storyline.\n\n"

        f"📖 **Story Structure:**\n"
        f"- Beginning: The protagonist discovers something mysterious that leads to an adventure.\n"
        f"- Middle: Several challenges and clues bring them closer to solving the mystery.\n"
        f"- End: An exciting resolution where they learn an important lesson and return home satisfied.\n\n"

        f"📚 **Key elements to include:**\n"
        f"- The child's best friends: {data.get('friends')}.\n"
        f"- Siblings: {data.get('siblings')}.\n"
        f"- Parents: {data.get('parents')}.\n"
        f"- Grandparents: {data.get('grandparents')}.\n"
        f"- Favorite animal: {data.get('favoriteAnimal')}.\n"
        f"- Favorite place: {data.get('favoritePlace')}.\n"
        f"- Interests: {data.get('interests')}.\n"
        f"- Mood of the story: {mood}.\n\n"

        f"📖 **Output MUST be in English.**"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": story_outline_prompt}],
            max_tokens=500
        )
        story_outline = response.choices[0].message.content.strip()
        logger.info("✅ Generated story outline.")

    except Exception as e:
        logger.error(f"❌ Error generating story outline: {e}")
        story_outline = "[No story outline could be generated]"

    return story_outline


def generate_chapter_overview(story_outline, num_chapters):
    """
    Skapar en kapitelöversikt baserat på berättelseplanen. Varje kapitel ska ha ett tydligt syfte och bidra till den röda tråden.
    """

    chapter_overview_prompt = (
        f"Based on the following story outline, divide the story into {num_chapters} chapters:\n\n"
        f"{story_outline}\n\n"
        f"📖 **Chapter Overview:**\n"
        f"- Briefly describe what happens in each chapter.\n"
        f"- Ensure that each chapter builds upon the storyline and leads toward the resolution.\n"
        f"- Make sure the final chapter provides a satisfying conclusion.\n"
        f"- The output must be in English."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": chapter_overview_prompt}],
            max_tokens=800
        )
        chapter_overview = response.choices[0].message.content.strip()
        logger.info("✅ Generated chapter overview.")

    except Exception as e:
        logger.error(f"❌ Error generating chapter overview: {e}")
        chapter_overview = "[No chapter overview could be generated]"

    return chapter_overview


def generate_story_chapters(name, theme, age, city, num_chapters, chapter_overview, data):
    """
    Genererar en sammanhängande berättelse kapitel för kapitel med rätt format och en röd tråd.
    """

    city_details = fetch_city_details(city)
    previous_summary = ""  # Håller reda på vad som hänt i föregående kapitel
    full_story = ""  # Samlar hela berättelsen här
     # 🔹 Skapa en dynamisk titel för boken
    book_title = generate_book_title(theme, name, city)

    # 🔹 Skapa en lista över element som måste inkluderas någon gång i berättelsen
    key_elements = f"""
    The story MUST include these elements at some point (but not necessarily in every chapter):
    - The child's best friends: {data.get('friends', 'N/A')}
    - Siblings: {data.get('siblings', 'N/A')}
    - Parents: {data.get('parents', 'N/A')}
    - Grandparents: {data.get('grandparents', 'N/A')}
    - Favorite animal: {data.get('favoriteAnimal', 'N/A')}
    - Favorite place: {data.get('favoritePlace', 'N/A')}
    - Interests: {data.get('interests', 'N/A')}
    """

    for chapter_number in range(1, num_chapters + 1):
        chapter_prompt = (
            f"Write chapter {chapter_number} of a children's story about {name}. "
            f"The theme is '{theme}', and the story is set in {city}. "
            f"The story follows this plan:\n\n"
            f"{chapter_overview}\n\n"
            f"📖 **Summary of previous chapters:**\n"
            f"{previous_summary}\n\n"
            f"📚 **Chapter Format:**\n"
            f"- Each chapter MUST start exactly like this: '### Kapitel {chapter_number}: [Chapter Title]'\n"
            f"- Separate chapters with `---`.\n"
            f"- The chapter should be at least 415 words long.\n"
            f"- The text MUST be written in Swedish.\n\n"
            f"{key_elements}"
        )

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": chapter_prompt}],
                max_tokens=930
            )
            generated_text = response.choices[0].message.content.strip()
            logger.info(f"✅ Generated chapter {chapter_number}")

            # Lägg till kapitlet i berättelsen
            full_story += f"{generated_text}\n\n"

            # Skapa en sammanfattning av kapitlet för nästa iteration
            previous_summary = generate_chapter_summary(generated_text)

        except Exception as e:
            logger.error(f"❌ Error generating chapter {chapter_number}: {e}")
            full_story += f"\n[Could not generate chapter {chapter_number}]\n"

    return {
         "title": book_title,
        "story_text": full_story
    }


def generate_chapter_summary(text):
    """
    Skapar en kort sammanfattning av kapitlet i 2-3 meningar för att hålla berättelsen sammanhängande.
    """
    summary_prompt = (
        f"Summarize the following chapter in 2-3 sentences, keeping the most important events and characters. "
        f"The summary should be concise and useful for maintaining a consistent narrative across multiple chapters.\n\n"
        f"{text}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": summary_prompt}],
            max_tokens=100
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"❌ Error generating chapter summary: {e}")
        return "Summary unavailable."

    
def generate_story_text(data):
    """
    Genererar berättelsen och extraherar kapitel för bildgenerering.
    """

    # 🔹 Generera berättelsen (hämta även city_details om det finns)
    story_data = generate_main_story_text(
        data.get('name'),
        data.get('theme'),
        data
    )

    avatar_url = data.get('avatar', None)
    avatar_key = os.path.splitext(os.path.basename(avatar_url))[0] if avatar_url else "male1"

    logger.info(f"🔍 Avatar Key Extracted: {avatar_key}")

    # 🔹 Generera sammanfattningar
    summary_text = generate_summary_text(story_data.get("story_text", ""))
    enhanced_summary = enhance_summary_text(summary_text)
    short_summary = generate_short_summary(story_data.get("story_text", ""), data.get("theme", "Unknown"))


    # 🔥 Hämta city_details om den finns i story_data
    city_details = story_data.get("city_details", "a vibrant and lively cityscape")  # 🔥 Fallback om ingen stad hittas

    # 🔥 Skapa en unik mapp för boken
    title = story_data.get("title", "Ingen Titel")
    book_folder = get_book_image_dir(title)  # ✅ NU skapas bokens unika mapp här

    # 🔹 Generera omslagsbild och spara i rätt mapp
    omslag_image_url = skapa_omslagsbild(
        data.get('theme', ''),
        avatar_key,
        short_summary,
        city_details  # 🔥 NU skickar vi city_details!
    )

    omslag_local_path = download_image(omslag_image_url, f"{title}_cover.png", book_folder)  # ✅ Sparar i bokens mapp

    # 🔹 Generera baksidebild och spara i rätt mapp
    backside_image_url = generate_backside_image(
        data.get('theme', ''),
        short_summary,
        city_details
    )

    backside_local_path = save_backside_image_locally(backside_image_url, title, book_folder)

    # 🔹 **EXTRAHERA KAPITEL FÖR BILDGENERERING**
    chapters = extract_chapters_from_text(story_data["story_text"])

    # 🔹 **GENERERA SCENBILDER**
    scene_images = generate_scene_images(chapters, avatar_key, data.get("style", "Pixar"), book_folder)  # ✅ Skickar rätt mapp

    return {
        'story_text': story_data.get("story_text", ""),
        'summary': enhanced_summary,
        'short_summary': short_summary,
        'title': title,
        'book_folder': book_folder,  # ✅ Skickar vidare rätt mapp
        'omslag_image_url': omslag_image_url,
        'backside_image_url': backside_image_url,
        'scene_images': scene_images,
        'scenes': chapters
    }



def generate_book_title(theme, name, city, age_group="barn"):
    """
    Genererar en mer dynamisk och kreativ titel för boken baserat på temat, karaktären och platsen.
    """

    title_prompt = (
        f"Skapa en kort, kreativ och fängslande boktitel på svenska för en barnbok. "
        f"Boken handlar om {name}, och temat är '{theme}'. Berättelsen utspelar sig i {city}. "
        f"\n\n📚 Exempel på bra barnbokstitlar:\n"
        f"- 'Mio, min Mio'\n"
        f"- 'Pippi Långstrump på de sju haven'\n"
        f"- 'Nils Karlsson-Pyssling'\n"
        f"- 'Jakten på den försvunna skatten'\n"
        f"- 'En magisk vinterkväll'\n\n"
        f"📖 Titeln ska vara:\n"
        f"- Kort (max 7 ord)\n"
        f"- Lätt att förstå och spännande\n"
        f"- Passa för en barnbok med målgruppen {age_group}\n"
        f"- Spegla temat och miljön i berättelsen\n\n"
        f"Generera endast titeln utan extra förklaringar."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": title_prompt}],
            max_tokens=15,
            temperature=1.0  # Ökar kreativiteten i svaren
        )
        title = response.choices[0].message.content.strip()
        logger.info(f"✅ Generated book title: {title}")
        return title
    except Exception as e:
        logger.error(f"❌ Error generating book title: {e}")
        return f"{theme} - En berättelse om {name}"



def extract_chapters_from_text(story_text):
    """
    Bryter upp hela berättelsen i individuella kapitel.
    """
    chapter_pattern = re.compile(r"### Kapitel (\d+): (.+?)\n\n(.*?)(?=\n\n### Kapitel \d+:|\Z)", re.DOTALL)
    chapters = []

    matches = chapter_pattern.findall(story_text)

    for match in matches:
        chapter_number = int(match[0])
        chapter_title = match[1].strip()
        chapter_text = match[2].strip()

        chapters.append({
            "scene_number": chapter_number,
            "chapter_title": chapter_title,
            "scene_description": chapter_text
        })

    logger.info(f"✅ Extraherade {len(chapters)} kapitel från berättelsen.")
    return chapters


def calculate_credits(story_text, selected_length, multiplier=4):

    """
    Beräknar kostnaden i credits baserat på tecken i berättelsen och en multiplikator för andra kostnader.
    """
    char_count = len(story_text)
    cost_per_char = {
    3500: 0.0001,
    7000: 0.00009,
    10000: 0.00008
    }[selected_length]

    base_cost = char_count * cost_per_char
    credits = int(base_cost * multiplier)  # Multiplicera med 4 för att täcka andra kostnader
    return credits, char_count
