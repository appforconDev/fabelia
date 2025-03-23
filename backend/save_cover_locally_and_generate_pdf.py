import os
import json
from pdf_generator import create_pdf_with_scenes  # Importera PDF-skapningsfunktionen
from utils import sanitize_filename
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_IMAGE_DIR = os.path.join(BASE_DIR, "temp_images")
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

PDF_DIR = os.path.join(BASE_DIR, "pdf_books")
os.makedirs(PDF_DIR, exist_ok=True)

def clean_book_images(book_folder):
    if not os.path.exists(book_folder):
        logger.warning(f"⚠️ Bokmappen {book_folder} existerar inte, ingen radering behövs.")
        return

    try:
        for filename in os.listdir(book_folder):
            file_path = os.path.join(book_folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Raderade temporär fil: {file_path}")
        os.rmdir(book_folder)  # Ta bort den tomma mappen
        logger.info(f"🗑️ Raderade mapp: {book_folder}")
    except Exception as e:
        logger.error(f"⚠️ Kunde inte radera bilder för boken: {e}")



def get_book_image_dir(title):
    """
    Skapar en unik mapp för en bok baserat på titeln.
    """
    book_folder = os.path.join(TEMP_IMAGE_DIR, sanitize_filename(title))
    os.makedirs(book_folder, exist_ok=True)
    return book_folder


def save_cover_locally_and_generate_pdf(story_response, pdf_path):
    """
    Genererar en PDF från story_response och loggar eventuella problem.
    """
    try:
        if not isinstance(story_response, dict):
            logger.error(f"🚨 Ogiltig story_response! Förväntade dict, fick: {type(story_response)}")
            return None

        title = story_response.get('title', 'Untitled')
        story_text = story_response.get('story_text', '')
        scenes = story_response.get('scenes', [])

        if not story_text:
            logger.error("🚨 Ingen berättelsetext hittades! PDF kan inte skapas.")
            return None

        logger.info(f"📄 Skapar PDF för: {title}")

        # 🔥 Hämta bokmappen där omslagsbilden och scenbilderna finns
        book_folder = get_book_image_dir(title)

        # ✅ Hämta omslagsbild
        cover_image_path = os.path.join(book_folder, f"{sanitize_filename(title)}_cover.png")
        if not os.path.exists(cover_image_path):
            default_cover = os.path.join(BASE_DIR, "static/default-cover.jpg")
            cover_image_path = default_cover if os.path.exists(default_cover) else None
            logger.warning("⚠️ Ingen specifik omslagsbild hittades. Använder standardbild.")

         # Fix backside image path to match the correct filename
        backside_local_path = os.path.join(book_folder, f"{sanitize_filename(title)}_backside.png")
        if not os.path.exists(backside_local_path):
            default_back_cover = os.path.join(BASE_DIR, "static/default-back-cover.jpg")
            backside_local_path = default_back_cover if os.path.exists(default_back_cover) else None
            logger.warning("⚠️ No specific backside image found. Using default image.")


        # 🔎 Hämta alla scenbilder
        available_images = [f for f in os.listdir(book_folder) if f.startswith("scene_") and f.endswith(".png")]
        scene_images = []

        for i, scene in enumerate(scenes, 1):
            scene_images_for_number = sorted(
                [img for img in available_images if f"scene_{scene.get('scene_number', i)}" in img],
                reverse=True
            )

            if scene_images_for_number:
                image_path = os.path.join(book_folder, scene_images_for_number[0])
                scene_images.append({
                    "scene_number": scene.get('scene_number', i),
                    "image_path": image_path,
                    "text": scene.get("scene_description", "")
                })
                logger.info(f"✅ Scenbild kopplad: {image_path} för scen {i}")
            else:
                logger.warning(f"⚠️ Ingen bild hittades för scen {i}")

        logger.info(f"📸 Totalt {len(scene_images)} scenbilder hittades.")

        # 🔥 Skapa PDF
        pdf_filename = os.path.join(PDF_DIR, f"{sanitize_filename(title)}.pdf")

        pdf_created = create_pdf_with_scenes(
            pdf_filename=pdf_filename,
            cover_image=cover_image_path,  # ✅ Använder rätt omslagsbild
            backside_image_path=backside_local_path,  # ✅ Lägg till baksidan som sista sida
            title=title,
            summary=story_response.get('summary', ''),  # 🔥 Skicka med sammanfattningen
            story=story_text,
            scene_images=scene_images,
            scenes=scenes
        )

        if pdf_created:
            logger.info(f"✅ PDF skapad: {pdf_created}")
            clean_book_images(book_folder)  # 🔥 Rensa bilderna efter att PDF är klar
            return pdf_created
        else:
            logger.error("❌ PDF kunde inte skapas!")
            return None

    except Exception as e:
        logger.error(f"🚨 Misslyckades att generera PDF: {e}", exc_info=True)
        return None
