import os
import requests
from reportlab.lib.pagesizes import A4, landscape, mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import re  
import logging  # 🆕 Lägg till logging
import uuid
from datetime import datetime 
import fitz  # PyMuPDF
from PIL import Image
import math

logger = logging.getLogger(__name__)

# Registrera det nya typsnittet
pdfmetrics.registerFont(TTFont("EBGaramond", "fonts/EBGaramond.ttf"))  # Se till att typsnittsfilerna finns i fonts/

# Basmappar
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_IMAGE_DIR = os.path.join(BASE_DIR, "temp_images")
PDF_DIR = os.path.join(BASE_DIR, "pdf_books")

# Dynamisk sökväg till logotypen
LOGO_PATH = os.path.join(BASE_DIR, "static", "images", "logo.png")

# Skapa mappar vid behov
for directory in [TEMP_IMAGE_DIR, PDF_DIR]:
    os.makedirs(directory, exist_ok=True)

# Gelato specific dimensions with bleeds
GELATO_COVER_SPREAD_WIDTH = 478.0 * mm
GELATO_COVER_SPREAD_HEIGHT = 326.0 * mm
GELATO_CONTENT_WIDTH = 216.0 * mm  # Sidstorlek inklusive bleeds
GELATO_CONTENT_HEIGHT = 286.0 * mm  # Sidstorlek inklusive bleeds
CONTENT_AREA_WIDTH = 210.0 * mm  # Innehållsområde (utan bleeds)
CONTENT_AREA_HEIGHT = 280.0 * mm  # Innehållsområde (utan bleeds)

def pdf_to_images(pdf_path, output_folder):
    """
    Konverterar en PDF till en lista av bildfiler och sparar dem i en mapp med PyMuPDF.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    logger.info(f"📄 Konverterar PDF till bilder: {pdf_path}")
    
    image_paths = []
    pdf_document = fitz.open(pdf_path)

    for page_number in range(len(pdf_document)):
        page = pdf_document.load_page(page_number)
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))  # 300 DPI
        image_filename = os.path.join(output_folder, f"page_{page_number + 1}.png")
        pix.save(image_filename)
        image_paths.append(image_filename)
        logger.info(f"✅ Sparade bild: {image_filename}")

    pdf_document.close()
    return image_paths

def create_gelato_pdf(pdf_filename, image_paths):
    logger.info(f"📄 Skapar Gelato PDF: {pdf_filename}")

    # Create a custom page size for the cover spread
    cover_spread_size = (GELATO_COVER_SPREAD_WIDTH, GELATO_COVER_SPREAD_HEIGHT)
    c = canvas.Canvas(pdf_filename, pagesize=cover_spread_size)

    # Sid 1: Cover spread (baksida + omslag)
    if len(image_paths) >= 2:
        backside_image = image_paths[-1]  # Last image is the backside
        cover_image = image_paths[0]  # First image is the cover

        # Draw backside on the left half
        if os.path.exists(backside_image):
            img = Image.open(backside_image)
            img_width, img_height = img.size
            aspect_ratio = img_width / img_height
            new_height = GELATO_COVER_SPREAD_HEIGHT
            new_width = new_height * aspect_ratio
            x_offset = (GELATO_COVER_SPREAD_WIDTH / 2 - new_width) / 2
            c.drawImage(ImageReader(backside_image), x_offset, 0, width=new_width, height=new_height)

        # Draw cover on the right half
        if os.path.exists(cover_image):
            img = Image.open(cover_image)
            img_width, img_height = img.size
            aspect_ratio = img_width / img_height
            new_height = GELATO_COVER_SPREAD_HEIGHT
            new_width = new_height * aspect_ratio
            x_offset = GELATO_COVER_SPREAD_WIDTH / 2 + (GELATO_COVER_SPREAD_WIDTH / 2 - new_width) / 2
            c.drawImage(ImageReader(cover_image), x_offset, 0, width=new_width, height=new_height)

    c.showPage()

    # Sid 2: Blank sida
    c.setPageSize((GELATO_CONTENT_WIDTH, GELATO_CONTENT_HEIGHT))  # Använd sidstorlek inklusive bleeds
    c.showPage()

    # Sid 3 - N: Kapitelsidor
    for img_path in image_paths[2:-1]:  # Skip cover and backside
        if os.path.exists(img_path):
            img = Image.open(img_path)
            img_width, img_height = img.size
            aspect_ratio = img_width / img_height

            # Beräkna storlek och placering för innehållsområdet
            if aspect_ratio > (CONTENT_AREA_WIDTH / CONTENT_AREA_HEIGHT):
                # Bredare bild än innehållsområde
                new_width = CONTENT_AREA_WIDTH
                new_height = new_width / aspect_ratio
            else:
                # Högre bild än innehållsområde
                new_height = CONTENT_AREA_HEIGHT
                new_width = new_height * aspect_ratio

            # Centrera innehållet inom innehållsområdet
            x_offset = (GELATO_CONTENT_WIDTH - new_width) / 2
            y_offset = (GELATO_CONTENT_HEIGHT - new_height) / 2

            c.drawImage(ImageReader(img_path), x_offset, y_offset, width=new_width, height=new_height)
        c.showPage()

    # Sista sidan: Blank sida
    c.setPageSize((GELATO_CONTENT_WIDTH, GELATO_CONTENT_HEIGHT))  # Använd samma storlek som innehållssidor
    c.showPage()  # Skapa en tom sida
   

    c.save()
    logger.info(f"✅ Gelato PDF skapad: {pdf_filename}")

    # Räkna sidor i den sparade PDF:en
    try:
        with fitz.open(pdf_filename) as doc:
            actual_page_count = len(doc)
            logger.info(f"📄 Gelato PDF har {actual_page_count} sidor (innan uppladdning till S3).")
            return pdf_filename, actual_page_count
    except Exception as e:
        logger.error(f"❌ Kunde inte räkna sidor i PDF: {e}")
        return pdf_filename, None

def split_story_into_scenes(story):
    """
    Delar upp berättelsen i scener genom att strikt identifiera mönstret **Scen X**
    och extraherar kapiteltitlar korrekt.
    """
    if not story:  
        return []

    scene_pattern = re.compile(r"\*\*Scen (\d+)\*\*\s*(.*)")
    scenes = []
    current_scene = {"title": "", "text": ""}

    for line in story.split("\n"):
        match = scene_pattern.match(line)
        if match:
            if current_scene["text"]:
                scenes.append(current_scene)

            current_scene = {"title": f"Scen {match.group(1)}: {match.group(2)}", "text": ""}
        else:
            current_scene["text"] += line + "\n"

    if current_scene["text"]:
        scenes.append(current_scene)

    return scenes

def wrap_text(text, max_width, font_name="EBGaramond", font_size=18):
    """
    Dela upp texten i kortare rader för att undvika att den rinner utanför sidan.
    """
    wrapped_lines = []
    words = text.split()

    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}".strip()
        if pdfmetrics.stringWidth(test_line, font_name, font_size) < max_width:
            current_line = test_line
        else:
            wrapped_lines.append(current_line)
            current_line = word
    if current_line:
        wrapped_lines.append(current_line)

    return wrapped_lines

def split_full_story_by_scenes(full_story, scenes):
    """
    Delar upp hela berättelsen (`full_story`) i separata kapitel baserat på GPT-genererade kapitel.
    """
    scene_texts = []
    chapter_pattern = re.compile(r"### Kapitel (\d+): (.+?)\n\n(.*?)(?=\n\n### Kapitel \d+:|\Z)", re.DOTALL)
    matches = chapter_pattern.findall(full_story)

    chapter_texts = []
    for match in matches:
        chapter_number = int(match[0])
        chapter_title = match[1].strip()
        chapter_body = match[2].strip()
        
        chapter_texts.append({
            "scene_number": chapter_number,
            "chapter_title": f"Kapitel {chapter_number}: {chapter_title}",
            "text": chapter_body
        })

    if len(chapter_texts) != len(scenes):
        logger.warning(f"⚠️ Antal kapitel ({len(chapter_texts)}) matchar INTE antalet scener ({len(scenes)}) exakt!")

    # ✅ Lägg till "chapter_title" så att det alltid finns i varje scen
    for i, scene in enumerate(scenes):
        if i < len(chapter_texts):
            scene_texts.append({
                "scene_number": scene["scene_number"],
                "chapter_title": chapter_texts[i]["chapter_title"],  # 🔥 FIXAT: Lägg till titeln
                "text": chapter_texts[i]["text"]
            })
        else:
            scene_texts.append({
                "scene_number": scene["scene_number"],
                "chapter_title": "Kapitel utan titel",  # 🔥 Fallback om titeln saknas
                "text": "[Text saknas]"
            })
    
    return scene_texts

def wrap_text_with_breaks(text, max_width, font_name="EBGaramond", font_size=18, sentences_per_break=3):
    # Rensa bort "---" från texten
    text = text.replace('---', '')
    
    # Dela upp i meningar
    sentences = re.split(r'(?<=[.!?])\s+', text)
    wrapped_lines = []
    current_line = ""
    
    for i, sentence in enumerate(sentences):
        # Rensa meningen och dela upp i ord
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Hantera hela meningen som en enhet
        words = sentence.split()
        sentence_lines = []
        current_sentence_line = ""
        
        for word in words:
            test_line = f"{current_sentence_line} {word}".strip()
            
            if pdfmetrics.stringWidth(test_line, font_name, font_size) < max_width:
                current_sentence_line = test_line
            else:
                sentence_lines.append(current_sentence_line)
                current_sentence_line = word
        
        if current_sentence_line:
            sentence_lines.append(current_sentence_line)
            
        # Lägg till alla rader för denna mening
        wrapped_lines.extend(sentence_lines)
        
        # Lägg till tom rad efter var tredje mening
        if (i + 1) % sentences_per_break == 0:
            wrapped_lines.append("")
    
    return wrapped_lines

def clean_text(title, summary):
    """
    Rensar titeln från ** och tar bort 'Beskrivning för omslagsbild:' från sammanfattningen.
    """
    title = title.strip('*"')  # Tar bort inledande/avslutande ** och "
    
    # Ta bort "Beskrivning för omslagsbild:" om den finns
    summary = re.sub(r'^Beskrivning för omslagsbild:\s*', '', summary, flags=re.IGNORECASE)

    return title, summary

def draw_text_with_outline(c, text, x, y, font_name, font_size, outline_width=2, outline_color=(0, 0, 0), fill_color=(1, 1, 1)):
    """
    Ritar text med en jämn outline genom att rita texten flera gånger med små förskjutningar
    för att skapa en kontur, och sedan rita huvudtexten ovanpå.
    """
    # Spara nuvarande grafikläge
    c.saveState()
    
    # Ställ in font för både kontur och text
    c.setFont(font_name, font_size)
    
    # Skapa konturen genom att rita texten flera gånger med små förskjutningar
    c.setFillColorRGB(*outline_color)
    
    # Rita flera förskjutna versioner för att skapa en jämn kontur
    offsets = []
    for i in range(0, 360, 45):  # 8 punkter runt i en cirkel
        angle_rad = math.radians(i)
        dx = outline_width * math.cos(angle_rad)
        dy = outline_width * math.sin(angle_rad)
        offsets.append((dx, dy))
    
    # Lägg till några extra punkter för tjockare kontur
    if outline_width > 1:
        for i in range(0, 360, 90):  # 4 extra punkter för tjockare kontur
            angle_rad = math.radians(i)
            dx = (outline_width/2) * math.cos(angle_rad)
            dy = (outline_width/2) * math.sin(angle_rad)
            offsets.append((dx, dy))
    
    # Rita text med alla förskjutningar för att skapa konturen
    for dx, dy in offsets:
        c.drawCentredString(x + dx, y + dy, text)
    
    # Rita huvudtexten med fyllningsfärgen
    c.setFillColorRGB(*fill_color)
    c.drawCentredString(x, y, text)
    
    # Återställ grafikläge
    c.restoreState()

def wrap_text_to_lines(text, max_width, font_name="EBGaramond", font_size=32):
    """
    Bryter upp en text i flera rader så att den passar inom en given bredd.
    """
    wrapped_lines = []
    words = text.split()
    current_line = ""

    for word in words:
        test_line = f"{current_line} {word}".strip()
        if pdfmetrics.stringWidth(test_line, font_name, font_size) < max_width:
            current_line = test_line
        else:
            wrapped_lines.append(current_line)
            current_line = word

    if current_line:
        wrapped_lines.append(current_line)

    return wrapped_lines

def draw_title_and_summary(c, title, summary, width, height, logo_path=LOGO_PATH):
    """
    Ritar titeln och sammanfattningen med en svart outline samt lägger till logotyp och CTA-text i nedre vänstra hörnet.
    """
    # ✅ Se till att width och height är numeriska
    try:
        width = float(width)
        height = float(height)
    except ValueError:
        logger.error(f"❌ Fel: width ({width}) eller height ({height}) är inte numeriska värden!")
        return

    # Rensa titeln och sammanfattningen
    title = title.strip('*"')
    summary = summary.strip()

    # 🎨 Fontinställningar
    title_font_size = 40
    summary_font_size = 22
    title_max_width = width - 100  
    summary_max_width = width - 150  

    # Dela upp titeln och sammanfattningen i rader
    title_lines = wrap_text_to_lines(title, title_max_width, font_size=title_font_size)
    summary_lines = wrap_text_to_lines(summary, summary_max_width, font_size=summary_font_size)

    # 📍 Placering av titeln
    title_y = height * 0.86  # 🔽 Flyttar ner titeln
    title_spacing = title_font_size + 8  

    # 🖋️ Rita titeln med svart outline
    for line in title_lines:
        draw_text_with_outline(c, line, width / 2, title_y, "EBGaramond", title_font_size, outline_width=3)
        title_y -= title_spacing

    # 📍 Placering av sammanfattningen
    summary_y = title_y - 50  

    # 🖋️ Rita sammanfattningen med svart outline
    for line in summary_lines:
        draw_text_with_outline(c, line, width / 2, summary_y, "EBGaramond", summary_font_size, outline_width=2)
        summary_y -= summary_font_size + 6  

    # 🏷️ **Placera logotypen i nedre vänstra hörnet**
    if os.path.exists(logo_path):
        logo_size = 60  
        logo_x = 117  
        logo_y = 100  

        c.drawImage(logo_path, logo_x, logo_y, logo_size, logo_size, mask="auto")

    # 🔗 **CTA-text med svart outline**
    c.setFont("EBGaramond", 14)
    draw_text_with_outline(c, "Beställ dina personliga böcker hos:", 150, 80, "EBGaramond", 14, outline_width=1)
    draw_text_with_outline(c, "https://www.fabelia.se", 150, 55, "EBGaramond", 14, outline_width=1)


def draw_title(c, title, width, height):
    """
    Ritar titeln längre ner på sidan samt lägger till logotyp och CTA-text i nedre vänstra hörnet.
    """
    # ✅ Se till att width och height är numeriska
    try:
        width = float(width)
        height = float(height)
    except ValueError:
        logger.error(f"❌ Fel: width ({width}) eller height ({height}) är inte numeriska värden!")
        return

    # Rensa titeln
    title = title.strip('*"')

    # 🎨 Fontinställningar
    title_font_size = 40
    title_max_width = width - 100  
    title_lines = wrap_text_to_lines(title, title_max_width, font_size=title_font_size)

    # 📍 Flytta ner titeln ytterligare
    title_y = height * 0.20  # 🔽 Flyttar titeln
    title_spacing = title_font_size + 8  

    for line in title_lines:
        draw_text_with_outline(c, line, width / 2, title_y, "EBGaramond", title_font_size, outline_width=3)
        title_y -= title_spacing

def create_pdf_with_scenes(pdf_filename, cover_image, title, story, scene_images, scenes, summary, backside_image_path=None):
    try:
        logger.info(f"📄 Startar PDF-generering för: {title}")

        c = canvas.Canvas(pdf_filename, pagesize=A4)
        width, height = map(float, A4)

        left_margin = 50   
        right_margin = 50  
        top_margin = 50    
        bottom_margin = 30 
        max_text_width = width - left_margin - right_margin  

        # Omslagsbild
        if cover_image and os.path.exists(cover_image):
            img = ImageReader(cover_image)
            img_width, img_height = img.getSize()

            # Beräkna skalfaktor baserat på PDF:ens bredd
            scale_factor = width / img_width  # Skala för att fylla hela bredden
            new_height = img_height * scale_factor  # Höjden efter skalning

            # Beräkna hur mycket vi behöver klippa av i över-/underkant
            y_offset = (new_height - height) / 2  # Halvera så att vi klipper lika mycket upptill/nedtill

            # Rita upp bilden - centrera vertikalt genom att flytta upp den något
            c.drawImage(img, 0, -y_offset, width, new_height, mask="auto")

        # Rensa bort onödiga citationstecken från titeln
        draw_title(c, title, width, height)

        # Dela upp berättelsen i kapitel
        scene_texts = split_full_story_by_scenes(story, scenes)

        for i, scene in enumerate(scene_texts):
            scene_number = scene["scene_number"]
            scene_img_path = next((img["image_path"] for img in scene_images if img["scene_number"] == scene_number), None)

            if not scene_img_path or not os.path.exists(scene_img_path):
                logger.warning(f"⚠️ Scenbild saknas för scen {scene_number}: {scene_img_path}")
                scene_img_path = None

            chapter_title = scene.get("chapter_title", "Kapitel utan titel")
            chapter_title = re.sub(r"^Kapitel \d+: ", "", chapter_title)
            scene_text = scene.get("text", "")

            c.showPage()

            # Hantera scenbild
            if scene_img_path and os.path.exists(scene_img_path):
                img = ImageReader(scene_img_path)
                aspect_ratio = img.getSize()[0] / img.getSize()[1]
                new_width = width
                new_height = new_width / aspect_ratio
                logger.info(f"🖼️ Lägger till scen {i+1} i PDF med bild: {scene_img_path}")
                c.drawImage(img, 0, height - new_height, new_width, new_height)
            else:
                new_height = 0

            # Kapitelrubrik
            text_y_position = height - new_height - 40 if scene_img_path else height - 50
            c.setFont("EBGaramond", 26)
            c.drawString(left_margin, text_y_position, chapter_title)

            # Text setup
            c.setFont("EBGaramond", 18)
            text = c.beginText(left_margin, text_y_position - 30)
            text.setLeading(24)

            # Ta bort eventuella '---' från texten
            scene_text = scene_text.replace('---', '')

            # Dela upp texten i meningar
            sentences = re.split(r'(?<=[.!?])\s+', scene_text)
            current_lines = []
            line_count = 0
            max_lines_first_page = int((text_y_position - bottom_margin - 30) / 24)
            max_lines_per_page = int((height - top_margin - bottom_margin) / 24)
            sentence_count = 0

            # Processer en mening i taget
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                # Bryt meningen i rader som passar sidbredden
                sentence_lines = []
                words = sentence.split()
                current_line = ""
                
                for word in words:
                    test_line = f"{current_line} {word}".strip()
                    if pdfmetrics.stringWidth(test_line, "EBGaramond", 18) < max_text_width:
                        current_line = test_line
                    else:
                        sentence_lines.append(current_line)
                        current_line = word
                
                if current_line:
                    sentence_lines.append(current_line)

                # Kontrollera om meningen skulle korsa sidhöver
                if line_count + len(sentence_lines) > max_lines_first_page and line_count > 0:
                    # Skriv ut nuvarande sida
                    text = c.beginText(left_margin, text_y_position - 30)
                    text.setFont("EBGaramond", 18)
                    text.setLeading(24)
                    
                    for line in current_lines:
                        text.textLine(line.strip())
                    c.drawText(text)

                    # Starta ny sida
                    c.showPage()
                    text_y_position = height - top_margin
                    line_count = 0
                    current_lines = []
                    max_lines_first_page = max_lines_per_page

                # Lägg till meningens rader på nuvarande sida
                current_lines.extend(sentence_lines)
                line_count += len(sentence_lines)
                sentence_count += 1

                # Lägg till extra radbrytning efter var tredje mening
                if sentence_count % 3 == 0:
                    current_lines.append("")
                    line_count += 1

            # Skriv ut kvarvarande rader
            if current_lines:
                text = c.beginText(left_margin, text_y_position - 30)
                text.setFont("EBGaramond", 18)
                text.setLeading(24)
                
                for line in current_lines:
                    text.textLine(line.strip())
                c.drawText(text)

        # Lägg till en tom sida innan backside image
        c.showPage()  # Tom sida
        logger.info("✅ La till en tom sida innan backside image")

        # Lägg till backside image som sista sida om den finns
        if backside_image_path and os.path.exists(backside_image_path):
            c.showPage()
            img = ImageReader(backside_image_path)
            img_width, img_height = img.getSize()
            
            # Beräkna skalning för att passa sidan samtidigt som bildens proportioner bibehålls
            scale_factor = width / img_width
            new_height = img_height * scale_factor
            
            # Centrera bilden vertikalt
            y_offset = (new_height - height) / 2
            
            # Rita upp backside image
            c.drawImage(img, 0, -y_offset, width, new_height, mask="auto")
            logger.info(f"✅ La till backside image: {backside_image_path}")

        # Lägg till titel och sammanfattning
        draw_title_and_summary(c, title, summary, width, height)

        c.save()
        logger.info(f"✅ PDF sparad: {pdf_filename}")
        return pdf_filename if os.path.exists(pdf_filename) else None

    except Exception as e:
        logger.error(f"🚨 Misslyckades att skapa PDF: {str(e)}", exc_info=True)
        return None

def generate_unique_filename(base_name, extension):
    """
    Genererar ett unikt filnamn baserat på tidsstämpel och UUID.
    Exempel: "scene_20250213_123456_abcd1234.png"
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = uuid.uuid4().hex[:8]  # Tar bara 8 tecken för att hålla det kort
    return f"{base_name}_{timestamp}_{unique_id}.{extension}"

def download_image(image_url, filename, book_folder):
    if not image_url:
        logger.warning(f"⚠️ Saknar bild-URL för {filename}")
        return None

    local_path = os.path.join(book_folder, filename)  # 🔥 Sparar i rätt bokmapp

    try:
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            with open(local_path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            logger.info(f"✅ Bild sparad lokalt: {local_path}")
            return local_path  # 🔥 Se till att returnera rätt filväg
        else:
            logger.warning(f"⚠️ Misslyckades att ladda ner bild {filename}, statuskod: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"⚠️ Fel vid nedladdning av bild {filename}: {e}")
        return None

def sanitize_filename(filename):
    """
    Rensar filnamn från ogiltiga tecken.
    """
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    return filename.strip()

def generate_pdf(story_data, scene_images, output_path, cover_image, title):
    """ 
    Skapar en PDF med omslag, titel, fullständig text och scenbilder.
    """
    print(f"📄 Försöker skapa PDF i {output_path}")

    if not isinstance(output_path, str) or not output_path.strip():
        print("🚨 Fel: output_path är ogiltig!")
        return None

    return create_pdf_with_scenes(output_path, cover_image, title, story_data, scene_images)