import os
import random
import traceback
import time
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from flask_migrate import Migrate
import sys
from models import db, Story, User, PromoCode, Tier, PromoCodeUsage, Scene
from tts import AudioMixer 
from openai_service import generate_story_text, generate_summary_text, generate_some_image, generate_scene_images, enhance_summary_text, generate_main_story_text, skapa_omslagsbild, fetch_city_details

import stripe
import requests
import re
import boto3 
from botocore.exceptions import NoCredentialsError
import json
from urllib.parse import unquote
import base64
import urllib
from io import BytesIO
from utils import generate_presigned_url, generate_presigned_upload_url, S3_BUCKET_NAME, s3_client
from PIL import Image, ImageDraw, ImageFont
import textwrap
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TCON, COMM, APIC
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
from pdf_generator import generate_pdf, create_pdf_with_scenes, pdf_to_images, create_gelato_pdf
from save_cover_locally_and_generate_pdf import save_cover_locally_and_generate_pdf, get_book_image_dir
from utils import sanitize_filename
from gelato_service import order_book_with_gelato  # ✅ Importera Gelato-funktionerna
from s3_upload import upload_image_to_s3, upload_pdf_to_s3


# Ladda miljövariabler från .env
load_dotenv()

# Konfigurera logging
logging.basicConfig(
    level=logging.DEBUG,  # Change to DEBUG to see more details
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # This ensures logs are printed to console
        logging.FileHandler('app.log')  # Optional: log to a file
    ]
)
logger = logging.getLogger(__name__)

# Initialisera Flask-applikationen
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Konfiguration för SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'audiobook_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp_images")
os.makedirs(TEMP_DIR, exist_ok=True)

TEMP_IMAGE_DIR = os.path.join(BASE_DIR, "temp_images")
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

# Mapp för PDF-filer
PDF_DIR = os.path.join(BASE_DIR, "pdf_books")
os.makedirs(PDF_DIR, exist_ok=True)

# Initiera databasen
db.init_app(app)

# Flask-Migrate
migrate = Migrate(app, db)

# Stripe API-nyckel
stripe.api_key = os.getenv("STRIPE_API_KEY")


# Placeholder-bildens sökväg
PLACEHOLDER_IMAGE_PATH = "/Users/rickardwinbergh/audiobook_backend/static/images/male.jpg"

# Dynamisk sökväg för testbilder
TEST_IMAGE_PATH = "/Users/rickardwinbergh/Fabelia/frontend/fabelia-frontend/public/images/test.png"
PDF_TEST_PATH = os.path.join(os.getcwd(), "test_output.pdf")


@app.route('/generate-test-pdf', methods=['POST'])
def generate_test_pdf():
    """
    En test-endpoint som skapar en PDF utan att behöva generera en bok.
    """
    try:
        logger.info("📄 Genererar test-PDF...")

        test_title = "Testbok: Äveyr i Bollnäs"
        test_story = "Det var en gång ett magiskt äventyr i skogarna runt Bollnäs..."
        test_summary = "Det var en gång ett magiskt äventyr i skogarna runt Bollnäs..."
        test_scenes = [
            {"scene_number": 1, "chapter_title": "Kapitel 1: Början", "text": "Det var en gång..."},
            {"scene_number": 2, "chapter_title": "Kapitel 2: Mysteriet", "text": "Plötsligt hände något..."}
        ]

        logger.info(f"🖼️ Använder omslagsbild: {TEST_IMAGE_PATH}")

        # ✅ Korrekt anrop utan `short_summary`
        pdf_path = create_pdf_with_scenes(
            pdf_filename=PDF_TEST_PATH,
            cover_image=TEST_IMAGE_PATH,
            backside_image_path=TEST_IMAGE_PATH,
            title=test_title,
            story=test_story,
            scene_images=[],
            scenes=test_scenes,
            summary=test_summary  # 🔥 Korrekt parameter istället för `short_summary`
        )

        if not pdf_path or not os.path.exists(pdf_path):
            logger.error("❌ PDF-genereringen misslyckades, filen skapades inte!")
            return jsonify({"error": "Kunde inte skapa PDF"}), 500

        # ✅ Logga PDF-filens sidantal
        try:
            with fitz.open(pdf_path) as doc:
                actual_page_count = len(doc)
                logger.info(f"📄 Test-PDF har {actual_page_count} sidor.")
        except Exception as e:
            logger.error(f"❌ Kunde inte räkna sidor i PDF: {e}")

        logger.info(f"✅ PDF genererad: {pdf_path}")
        return send_file(pdf_path, as_attachment=True)

    except Exception as e:
        logger.error(f"🚨 Fel vid generering av PDF: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


def download_pdf(pdf_url):
    """
    Ladda ner en PDF från en URL och spara den lokalt.
    
    Args:
        pdf_url (str): URL till PDF-filen som ska laddas ner.
    
    Returns:
        str: Sökvägen till den nedladdade PDF-filen, eller None om nedladdningen misslyckades.
    """
    try:
        # Skapa en unik filnamn för den nedladdade PDF:en
        pdf_filename = os.path.join(TEMP_IMAGE_DIR, "downloaded_pdf.pdf")
        
        # Ladda ner PDF:en från URL:en
        response = requests.get(pdf_url, stream=True)
        if response.status_code == 200:
            with open(pdf_filename, "wb") as pdf_file:
                for chunk in response.iter_content(1024):
                    pdf_file.write(chunk)
            logger.info(f"✅ PDF nedladdad och sparad som: {pdf_filename}")
            return pdf_filename
        else:
            logger.error(f"❌ Misslyckades att ladda ner PDF: Statuskod {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"❌ Fel vid nedladdning av PDF: {e}")
        return None

@app.route("/order-book", methods=["POST"])
def order_book():
    data = request.json
    print("📥 Mottagen JSON:", data)  # 🔍 Logga all inkommande data

    # Säkerställ att user_id finns
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "Användar-ID saknas"}), 400

    pdf_url = data.get("pdf_url")
    if not pdf_url:
        return jsonify({"error": "Ingen PDF-URL angiven"}), 400

    # Ladda ner den befintliga PDF:en
    pdf_path = download_pdf(pdf_url)
    if not pdf_path:
        return jsonify({"error": "Misslyckades att ladda ner PDF"}), 500

    # Konvertera PDF till bilder
    output_folder = os.path.join(TEMP_IMAGE_DIR, "gelato_pages")
    image_paths = pdf_to_images(pdf_path, output_folder)

    if not image_paths:
        return jsonify({"error": "Misslyckades att konvertera PDF till bilder"}), 500

    # Skapa Gelato-optimerad PDF och räkna sidor
    gelato_pdf_path, actual_page_count = create_gelato_pdf(os.path.join(PDF_DIR, "gelato_ready.pdf"), image_paths)

    if not actual_page_count:
        return jsonify({"error": "Misslyckades att räkna sidor i PDF"}), 500

    # Justera sidantalet så att det är jämnt
    inner_pages = actual_page_count - 4  # Exkludera omslag och icke-skrivbara sidor
    if inner_pages % 2 != 0:
        inner_pages += 1  # Gör jämnt om udda
    adjusted_page_count = inner_pages    
    logger.info(f"📄 Slutligt sidantal för Gelato: {adjusted_page_count} (ursprungligt: {actual_page_count})")

    # Ladda upp Gelato-optimerad PDF till S3
    try:
        s3_pdf_key = f"{user_id}/pdf/gelato_ready.pdf"  # Använd user_id
        gelato_pdf_url = upload_binary(gelato_pdf_path, s3_pdf_key, file_type='application/pdf')
        logger.info(f"✅ Gelato PDF uppladdad till S3: {gelato_pdf_url}")
    except Exception as e:
        logger.error(f"❌ Misslyckades att ladda upp Gelato PDF till S3: {e}")
        return jsonify({"error": "Misslyckades att ladda upp Gelato PDF"}), 500

    # Skicka till Gelato med det justerade sidantalet
    order = order_book_with_gelato(
        gelato_pdf_url, adjusted_page_count, data["customer_name"],
        data["address"], data["city"], data["country"],
        data["postal_code"], data["email"]
    )

    if not order:
        return jsonify({"error": "Misslyckades att beställa boken"}), 500

    # Rensa temporära bilder efter att beställningen har skickats
    clean_temp_images()

    return jsonify({
        "message": "Bokbeställning skapad!",
        "order_id": order["id"],
        "gelato_pdf_url": gelato_pdf_url
    })






def clean_temp_images():
    """
    Raderar alla temporära bilder i TEMP_IMAGE_DIR efter att PDF har skapats.
    """
    try:
        for filename in os.listdir(TEMP_IMAGE_DIR):
            file_path = os.path.join(TEMP_IMAGE_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Raderade temporär fil: {file_path}")
    except Exception as e:
        logger.error(f"⚠️ Kunde inte radera temporära bilder: {e}")



@app.route('/admin/promo-codes', methods=['GET'])
def get_promo_codes():
    codes = PromoCode.query.all()
    return jsonify({"codes": [{"id": code.id, "code": code.code, "discount": code.discount, "uses": code.uses} for code in codes]})

from flask import session

@app.route('/affiliate/promo-codes', methods=['GET'])
def get_promo_affiliate_codes():
    user_id = request.args.get('user_id')  # Hämta user_id från query-parametern
    if not user_id:
        return jsonify({"error": "user_id krävs"}), 400

    # Filtrera koder baserat på användarens e-post eller ID
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "Användare hittades inte"}), 404

    codes = PromoCode.query.filter_by(email=user.email).all()
    return jsonify({
        "codes": [
            {"id": code.id, "code": code.code, "discount": code.discount, "uses": code.uses}
            for code in codes
        ]
    }), 200





@app.route('/admin/add-promo-code', methods=['POST'])
def add_promo_code():
    try:
        data = request.json
        code = data.get('code')
        discount = data.get('discount')
        email = data.get('email')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_indefinite = data.get('is_indefinite', False)

        if not code or not discount or not email:
            return jsonify({"error": "Rabattkod, rabatt, och e-post krävs"}), 400

        # Om start- och slutdatum är angivna, konvertera dem till datetime
        start_date = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
        end_date = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None

        # Skapa och spara rabattkoden
        new_code = PromoCode(
            code=code,
            discount=discount,
            email=email,
            start_date=start_date,
            end_date=end_date,
            is_indefinite=is_indefinite,
            uses=0
        )
        db.session.add(new_code)
        db.session.commit()
        return jsonify({"message": "Rabattkod tillagd"}), 201
    except Exception as e:
        logger.error(f"Fel vid tillägg av rabattkod: {e}")
        return jsonify({"error": "Ett fel inträffade"}), 500

@app.route('/affiliate/add-promo-code', methods=['POST'])
def add_affiliate_promo_code():
    try:
        data = request.json
        logger.info(f"Data mottagen i /affiliate/add-promo-code: {data}")
        
        code = data.get('code')
        discount = data.get('discount')
        user_id = data.get('user_id')  # Hämta user_id från payload
        email = data.get('email')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_indefinite = data.get('is_indefinite', False)

        if not code or not discount or not email or not user_id:
            return jsonify({"error": "Rabattkod, rabatt, e-post och user_id krävs"}), 400

        # Om start- och slutdatum är angivna, konvertera dem till datetime
        start_date = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
        end_date = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None

        # Skapa och spara rabattkoden
        new_code = PromoCode(
            code=code,
            discount=discount,
            user_id=user_id,  # Lägg till user_id här
            email=email,
            start_date=start_date,
            end_date=end_date,
            is_indefinite=is_indefinite,
            uses=0
        )
        db.session.add(new_code)
        db.session.commit()
        return jsonify({"message": "Rabattkod tillagd"}), 201
    except Exception as e:
        logger.error(f"Fel vid tillägg av rabattkod: {e}", exc_info=True)
        return jsonify({"error": "Ett fel inträffade"}), 500






@app.route('/apply-promo-code', methods=['POST'])
def apply_promo_code():
    try:
        data = request.json
        user_id = data.get('user_id')
        promo_code_input = data.get('promo_code')

        if not user_id or not promo_code_input:
            return jsonify({"error": "Användar-ID och rabattkod krävs"}), 400

        promo_code = PromoCode.query.filter_by(code=promo_code_input).first()
        if not promo_code:
            return jsonify({"error": "Ogiltig rabattkod"}), 404

        # Returnera rabattkodsinfo utan att öka användningen
        return jsonify({
            "message": "Rabattkod är giltig",
            "discount": promo_code.discount,
            "promo_code_id": promo_code.id  # Rabattkodens ID skickas tillbaka
        }), 200
    except Exception as e:
        logger.error(f"Fel vid tillämpning av rabattkod: {e}")
        return jsonify({"error": "Ett fel inträffade"}), 500






@app.route('/admin/tiers', methods=['GET'])
def get_tiers():
    tiers = Tier.query.all()
    return jsonify([{"id": tier.id, "credits": tier.credits, "price": tier.price, "description": tier.description} for tier in tiers])

@app.route('/affiliate/tiers', methods=['GET'])
def get_affiliate_tiers():
    tiers = Tier.query.all()
    print("Tiers hämtade från databasen:", tiers)  # Lägg till denna logg
    return jsonify([{"id": tier.id, "credits": tier.credits, "price": tier.price, "description": tier.description} for tier in tiers])




@app.route('/admin/send-email/<int:promo_code_id>', methods=['POST'])
def send_promo_code_email(promo_code_id):
    try:
        promo_code = PromoCode.query.get(promo_code_id)
        if not promo_code or not promo_code.email:
            return jsonify({"error": "Rabattkod eller e-post hittades inte"}), 404

        # Skapa meddelandet
        message = f"""
        Hej!

        Här är information om din rabattkod:
        Kod: {promo_code.code}
        Rabatt: {promo_code.discount}%
        Användningar: {promo_code.uses}
        Giltig från: {promo_code.start_date or 'Tills vidare'}
        Giltig till: {promo_code.end_date or 'Tills vidare'}

        Tack för att du använder våra tjänster!
        """
        msg = MIMEText(message)
        msg['Subject'] = 'Information om din Rabattkod'
        msg['From'] = 'din-epost@example.com'
        msg['To'] = promo_code.email

        # Skicka e-post
        with smtplib.SMTP('smtp.example.com', 587) as server:
            server.starttls()
            server.login('din-epost@example.com', 'ditt-lösenord')
            server.sendmail(msg['From'], [msg['To']], msg.as_string())

        return jsonify({"message": "E-post skickad!"}), 200

    except Exception as e:
        logger.error(f"Fel vid e-postutskick: {e}")
        return jsonify({"error": "Ett fel inträffade"}), 500


@app.route('/admin/delete-promo-code/<int:promo_code_id>', methods=['DELETE'])
def delete_promo_code(promo_code_id):
    try:
        # Hitta rabattkoden i databasen
        promo_code = PromoCode.query.get(promo_code_id)
        if not promo_code:
            return jsonify({"error": "Rabattkod hittades inte"}), 404

        # Ta bort alla relaterade användningar av rabattkoden
        PromoCodeUsage.query.filter_by(promo_code_id=promo_code.id).delete()

        # Ta bort rabattkoden
        db.session.delete(promo_code)
        db.session.commit()

        return jsonify({"message": "Rabattkod och dess användningar har raderats"}), 200
    except Exception as e:
        logger.error(f"Fel vid radering av rabattkod: {e}")
        return jsonify({"error": "Ett fel inträffade"}), 500
    
@app.route('/affiliate/delete-promo-code/<int:promo_code_id>', methods=['DELETE'])
def delete_affiliate_promo_code(promo_code_id):
    try:
        # Hitta rabattkoden i databasen
        promo_code = PromoCode.query.get(promo_code_id)
        if not promo_code:
            return jsonify({"error": "Rabattkod hittades inte"}), 404

        # Ta bort alla relaterade användningar av rabattkoden
        PromoCodeUsage.query.filter_by(promo_code_id=promo_code.id).delete()

        # Ta bort rabattkoden
        db.session.delete(promo_code)
        db.session.commit()

        return jsonify({"message": "Rabattkod och dess användningar har raderats"}), 200
    except Exception as e:
        logger.error(f"Fel vid radering av rabattkod: {e}")
        return jsonify({"error": "Ett fel inträffade"}), 500
    

@app.route('/admin/promo-code-usage/<promo_code_id>', methods=['GET'])
def get_promo_code_usage(promo_code_id):
    usages = db.session.query(
        Tier.id,
        Tier.credits,
        Tier.price,
        Tier.description,
        db.func.count(PromoCodeUsage.id).label('usage_count')
    ).join(PromoCodeUsage, PromoCodeUsage.tier_id == Tier.id) \
     .filter(PromoCodeUsage.promo_code_id == promo_code_id) \
     .group_by(Tier.id).all()

    result = [
        {
            "tier_id": usage.id,
            "tier_credits": usage.credits,
            "tier_price": usage.price,
            "tier_description": usage.description,
            "usage_count": usage.usage_count
        }
        for usage in usages
    ]
    return jsonify(result), 200

@app.route('/affiliate/promo-code-usage', methods=['GET'])
def get_all_affiliate_promo_code_usage():
    try:
        # Hämta user_id från query-parametrar
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID krävs"}), 401

        logger.info(f"Användar-ID mottaget: {user_id}")

        # Hämta alla promo codes för användaren
        promo_codes = PromoCode.query.filter_by(user_id=user_id).all()
        if not promo_codes:
            return jsonify({"message": "Inga koder hittades för användaren"}), 200

        logger.info(f"PromoCodes hittade för user_id {user_id}: {[code.id for code in promo_codes]}")

        # Hämta användningar
        usage_query = db.session.query(
            PromoCodeUsage.promo_code_id,
            PromoCodeUsage.tier_id,
            db.func.count(PromoCodeUsage.id).label('usage_count')
        ).filter(PromoCodeUsage.promo_code_id.in_([code.id for code in promo_codes])) \
         .group_by(PromoCodeUsage.promo_code_id, PromoCodeUsage.tier_id).all()

        usage_map = {}
        for promo_code_id, tier_id, usage_count in usage_query:
            if promo_code_id not in usage_map:
                usage_map[promo_code_id] = []
            usage_map[promo_code_id].append({"tier_id": tier_id, "usage_count": usage_count})

        logger.info(f"Genererad användningsdata: {usage_map}")
        return jsonify(usage_map), 200

    except Exception as e:
        logger.error(f"Fel vid hämtning av användningsdata: {e}", exc_info=True)
        return jsonify({"error": "Internt serverfel", "details": str(e)}), 500





@app.route('/admin/promo-code-usage', methods=['GET'])
def get_all_promo_code_usage():
    try:
        promo_codes = db.session.query(PromoCode.id, PromoCode.code).all()
        tiers = db.session.query(Tier.id, Tier.credits).all()

        # Hämtar användningar grupperade efter promo_code och tier
        usage_query = db.session.query(
            PromoCodeUsage.promo_code_id,
            PromoCodeUsage.tier_id,
            db.func.count(PromoCodeUsage.id).label('usage_count')
        ).group_by(PromoCodeUsage.promo_code_id, PromoCodeUsage.tier_id).all()

        # Omvandla resultat till en dictionary för enkel hantering
        usage_map = {}
        for promo_code_id, tier_id, usage_count in usage_query:
            if promo_code_id not in usage_map:
                usage_map[promo_code_id] = {}
            usage_map[promo_code_id][tier_id] = usage_count

        # Generera resultat
        result = []
        for promo_code_id, promo_code_name in promo_codes:
            promo_code_usages = {
                "promo_code_id": promo_code_id,
                "promo_code_name": promo_code_name,
                "tiers": [
                    {
                        "tier_id": tier_id,
                        "tier_credits": credits,
                        "usage_count": usage_map.get(promo_code_id, {}).get(tier_id, 0)  # Standard 0 om inte använd
                    }
                    for tier_id, credits in tiers
                ]
            }
            result.append(promo_code_usages)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route('/api/save-stripe-account', methods=['POST'])
def save_stripe_account():
    try:
        data = request.json
        logger.info(f"Mottagen data: {data}")  # Logga vad som skickas
        user_id = data.get('user_id')
        stripe_account_id = data.get('stripe_account_id')

        if not user_id or not stripe_account_id:
            logger.warning("User ID eller Stripe Account ID saknas")  # Logga varför det misslyckas
            return jsonify({"error": "User ID och Stripe Account ID krävs"}), 400

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "Användare hittades inte"}), 404

        user.stripe_account_id = stripe_account_id
        db.session.commit()
        logger.info(f"Stripe-konto-ID sparat för användare {user_id}")
        return jsonify({"message": "Stripe-konto sparat"}), 200

    except Exception as e:
        logger.error(f"Fel vid sparande av Stripe-uppgifter: {e}", exc_info=True)
        return jsonify({"error": "Internt serverfel"}), 500


@app.route('/api/get-stripe-account', methods=['GET'])
def get_stripe_account():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID krävs"}), 400

        user = User.query.filter_by(id=user_id).first()  # Ändrat från username till id
        if not user:
            return jsonify({"error": "Användare hittades inte"}), 404

        return jsonify({"stripe_account_id": user.stripe_account_id}), 200
    except Exception as e:
        logger.error(f"Fel vid hämtning av Stripe-uppgifter: {e}")
        return jsonify({"error": "Internt serverfel"}), 500




@app.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        stripe.api_key = os.getenv("STRIPE_API_KEY")  # Säkerställ att Stripe-nyckeln är laddad
        data = request.json

        # Hämta data från request
        user_id = data.get("user_id")
        tier_id = data.get("tier_id")
        price_in_cents = data.get("price_in_cents")
        promo_code_id = data.get("promo_code_id")  # Rabattkodens ID

        # Logga inkommande data
        logger.info(f"Data mottagen i /create-payment-intent: user_id={user_id}, tier_id={tier_id}, price_in_cents={price_in_cents}, promo_code_id={promo_code_id}")

        # Kontrollera obligatoriska fält
        if not user_id or not tier_id or not price_in_cents:
            logger.warning("Saknade obligatoriska fält i förfrågan")
            return jsonify({"error": "Saknade fält i förfrågan"}), 400

        # Skapa PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=price_in_cents,
            currency="usd",
            metadata={
                "user_id": user_id,
                "tier_id": tier_id,
                "promo_code_id": promo_code_id or "None" # Rabattkodens ID läggs till i metadata
            },
        )

        # Logga att PaymentIntent skapades
        logger.info(f"PaymentIntent skapat med Client Secret: {intent.client_secret[:8]}...")
        return jsonify({"clientSecret": intent.client_secret}), 200
    except Exception as e:
        # Logga eventuella fel
        logger.error(f"Stripe error: {e}")
        return jsonify({"error": str(e)}), 500





@app.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        logger.info(f"Webhook-event mottaget: {event['type']}")

        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            user_id = payment_intent['metadata'].get('user_id')
            tier_id = payment_intent['metadata'].get('tier_id')
            promo_code_id = payment_intent['metadata'].get('promo_code_id')

            # Kontrollera att alla metadata finns
            if not user_id or not tier_id:
                logger.error(f"Saknade metadata i PaymentIntent: user_id={user_id}, tier_id={tier_id}")
                return "Missing metadata", 400

            # Uppdatera användarens krediter
            user = User.query.filter_by(id=user_id).first()
            tier = Tier.query.filter_by(id=tier_id).first()
            if user and tier:
                user.credits += tier.credits
                db.session.commit()
                logger.info(f"Uppdaterade krediter för användare {user_id}: {user.credits}")
            else:
                logger.error(f"Användare eller tier hittades inte: user_id={user_id}, tier_id={tier_id}")
                return "User or tier not found", 400

        return '', 200
    except Exception as e:
        logger.error(f"Webhook verifieringsfel: {e}")
        return "Invalid signature", 400



@app.route('/affiliate/check-promo-code', methods=['GET', 'POST'])
def check_promo_code():
    if request.method == 'GET':
        code = request.args.get('code', '').strip()
        if not code:
            return jsonify({"error": "Ingen kod skickades."}), 400

        exists = PromoCode.query.filter_by(code=code).first() is not None
        return jsonify({"exists": exists}), 200

    elif request.method == 'POST':
        data = request.json
        user_id = data.get("user_id")
        promo_code = data.get("promo_code")

        if not user_id or not promo_code:
            return jsonify({"error": "Missing user_id or promo_code"}), 400

        promo = PromoCode.query.filter_by(code=promo_code).first()
        if not promo:
            return jsonify({"error": "Rabattkoden finns inte"}), 404

        existing_usage = PromoCodeUsage.query.filter_by(user_id=user_id, promo_code_id=promo.id).first()

        return jsonify({
            "alreadyUsed": bool(existing_usage),
            "discount": promo.discount if not existing_usage else None,
            "promo_code_id": promo.id if not existing_usage else None
        }), 200







@app.route('/get-stripe-key', methods=['GET'])
def get_stripe_key():
    try:
        stripe_publishable_key = os.getenv("STRIPE_PUBLISHABLE_KEY")
        if not stripe_publishable_key:
            raise ValueError("Stripe public key saknas i miljövariabler.")
        return jsonify({"publishableKey": stripe_publishable_key}), 200
    except Exception as e:
        logger.error(f"Fel vid hämtning av Stripe-nyckel: {e}")
        return jsonify({"error": "Fel vid hämtning av Stripe-nyckel"}), 500


@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        user_id = data.get('user_id')
        tier_id = data.get('tier_id')
        price_in_cents = data.get('price_in_cents')  # Redan rabatterat pris i cent
        original_price_in_cents = data.get('original_price_in_cents')
        discount = data.get('discount', 0)

        if not all([user_id, tier_id, price_in_cents]):
            return jsonify({"error": "Saknade fält i förfrågan"}), 400

        # Hämta tier-information
        tiers = {
            1: {"credits": 500},
            2: {"credits": 900},
            3: {"credits": 1400}
        }

        tier = tiers.get(tier_id)
        if not tier:
            return jsonify({"error": "Ogiltig tier"}), 400

        # Logga värden för debugging
        logger.info(f"Skapar Stripe-session med:")
        logger.info(f"Originalpris (cent): {original_price_in_cents}")
        logger.info(f"Rabatterat pris (cent): {price_in_cents}")
        logger.info(f"Rabattprocent: {discount}%")
        logger.info(f"Tier ID: {tier_id}")

        description = f"{tier['credits']} Credits"
        if discount > 0:
            description += f" (Rabatt: {discount}%)"

        # Skapa Stripe-session med tier_id som metadata
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': description,
                    },
                    'unit_amount': price_in_cents,  # Rabatterat pris
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/cancel',
            metadata={
                'user_id': user_id,
                'tier_id': str(tier_id),  # Lägg till tier_id
                'original_price': str(original_price_in_cents),
                'final_price': str(price_in_cents),
                'discount_applied': str(discount)
            }
        )

        return jsonify({
            'url': session.url,
            'debug_info': {
                'original_price_cents': original_price_in_cents,
                'final_price_cents': price_in_cents,
                'discount': discount
            }
        }), 200

    except Exception as e:
        logger.error(f"Fel vid skapande av Stripe Checkout-session: {e}")
        return jsonify({'error': str(e)}), 500



@app.route('/api/get-user', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    logger.info(f"Inkommande förfrågan för user_id: {user_id}")
    
    if not user_id:
        logger.error("User ID saknas i förfrågan")
        return jsonify({"error": "User ID krävs"}), 400

    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            logger.warning(f"Användare med ID {user_id} hittades inte")
            return jsonify({"error": "Användare hittades inte"}), 404

        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "credits": user.credits or 0
        }
        logger.info(f"Returnerar användardata: {user_data}")
        return jsonify(user_data), 200
        
    except Exception as e:
        logger.error(f"Databasfel: {str(e)}")
        return jsonify({"error": "Serverfel"}), 500





def generate_data_uri(image_url):
    try:
        timestamp = int(time.time())  # Lägg till en tidsstämpel för att undvika cache
        image_url_with_timestamp = f"{image_url}?t={timestamp}"
        response = requests.get(image_url_with_timestamp, stream=True)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type')
            image_data = base64.b64encode(response.content).decode('utf-8')
            return f"data:{content_type};base64,{image_data}"
        else:
            logger.error(f"Misslyckades att hämta bild: {image_url_with_timestamp} (Status: {response.status_code})")
            return None
    except Exception as e:
        logger.error(f"Fel vid hämtning av bild: {e}")
        return None







# Lista över tillgängliga ljudfiler (ange din sökväg till ljudfiler)
sound_files = [
    "sounds/1.mp3",
    "sounds/2.mp3",
    "sounds/3.mp3",
    "sounds/4.mp3",
    "sounds/5.mp3"
]

# Skapa en instans av AudioMixer med lista över bakgrundsmusikfiler
audio_mixer = AudioMixer(sound_files)

def add_metadata_to_mp3(file_path, title, artist, album, genre, year, comment, cover_image_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        audio.add_tags()  # Skapar ID3-tags om de inte finns
        
        # Lägg till metadata
        audio.tags.add(TIT2(encoding=3, text=title))  # Titel
        audio.tags.add(TPE1(encoding=3, text=artist))  # Artist
        audio.tags.add(TALB(encoding=3, text=album))  # Album
        audio.tags.add(TCON(encoding=3, text=genre))  # Genre
        audio.tags.add(COMM(encoding=3, desc="Comment", text=comment))  # Kommentar
        
        # Lägg till år (år stöds inte som en separat tag i ID3 v2.4)
        audio["TDRC"] = year

        # Lägg till omslagsbild
        if cover_image_path:
            with open(cover_image_path, "rb") as img:
                audio.tags.add(
                    APIC(
                        encoding=3,  # UTF-8
                        mime="image/jpeg",  # MIME-typ för omslagsbild
                        type=3,  # Främre omslag
                        desc="Cover",
                        data=img.read()
                    )
                )
        
        audio.save()
        logger.info(f"Metadata har lagts till för {file_path}")
    except Exception as e:
        logger.error(f"Fel vid tillägg av metadata till MP3: {e}", exc_info=True)



@app.route('/')
def home():
    return "Välkommen till ljudboksappen! API:erna är redo för användning."

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resurs hittades inte', 'details': str(error)}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internt serverfel', 'details': str(error)}), 500

@app.route('/delete-product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID saknas'}), 400

        # Hitta produkten i databasen
        logger.info(f"🔍 Försöker radera produkt. product_id: {product_id}, user_id: {user_id}")

        product = Story.query.filter_by(id=product_id, user_id=user_id).first()
        if not product:
            logger.warning(f"❌ Produkten hittades inte eller tillhör inte användaren. product_id: {product_id}, user_id: {user_id}")
            return jsonify({'error': 'Produkten hittades inte eller tillhör inte användaren'}), 404

        # Ta bort från S3 om det finns länkar
        if product.pdf_url:
            try:
                s3_key = product.pdf_url.split(f"{S3_BUCKET_NAME}/")[-1]
                s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            except Exception as e:
                logger.error(f"Fel vid radering av PDF från S3: {e}", exc_info=True)

        if product.audio_url:
            try:
                s3_key = product.audio_url.split(f"{S3_BUCKET_NAME}/")[-1]
                s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            except Exception as e:
                logger.error(f"Fel vid radering av ljudfil från S3: {e}", exc_info=True)

        # Ta bort produkten från databasen
        db.session.delete(product)
        db.session.commit()

        logger.info(f"Produkt raderad: {product_id}")
        return jsonify({'message': 'Produkten har raderats framgångsrikt.'}), 200

    except Exception as e:
        logger.error(f"Fel vid radering av produkt: {e}", exc_info=True)
        return jsonify({'error': f'Ett internt fel inträffade: {str(e)}'}), 500



def sanitize_title(title):
    """
    Sanerar titeln för att ta bort otillåtna tecken och formatera den korrekt.
    """
    return re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')

def clean_temp_images():
    """
    Raderar alla temporära bilder efter att PDF har skapats.
    """
    try:
        for filename in os.listdir(TEMP_IMAGE_DIR):
            file_path = os.path.join(TEMP_IMAGE_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Raderade temporär fil: {file_path}")
    except Exception as e:
        logger.error(f"⚠️ Kunde inte radera temporära bilder: {e}")



@app.route('/create-script', methods=['POST'])
def create_script():
    try:
        # 1. Hämta och validera data
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            raise ValueError("Användar-ID saknas")

        logger.info("📥 Förfrågan mottagen för /create-script")

        name = data.get('name')
        if not name:
            raise ValueError("Namn måste anges")
        theme = data.get('theme', '')
        book_type = data.get('bookType', 'both')  # Styr om vi skapar PDF eller bara ljudbok
        logger.info(f"📚 Boktyp: {book_type}")

        selected_tokens = data.get('audioLength')
        if not selected_tokens:
            raise ValueError("Längd för ljudboken måste väljas.")

        selected_tokens = int(selected_tokens)

        length_options = [
            {'tokens': 5000, 'credits': 200},
            {'tokens': 9000, 'credits': 400},
            {'tokens': 14000, 'credits': 600}
        ]

        # Hitta rätt antal credits baserat på vald längd
        credits_needed = None
        for option in length_options:
            if option['tokens'] == selected_tokens:
                credits_needed = option['credits']
                break

        if credits_needed is None:
            raise ValueError("Ogiltig längd vald för ljudboken.")

        # 2. Hämta användare från databasen
        user = User.query.filter_by(id=user_id).first()
        if not user:
            raise ValueError("Användaren hittades inte")
        if user.credits < credits_needed:
            logger.warning("❌ Otillräckliga credits")
            return jsonify({"error": "Otillräckliga credits"}), 400

        # Dra av krediter
        user.credits -= credits_needed
        db.session.commit()

        # 3. Generera berättelse och scener
        logger.info("📝 Startar berättelsegenerering.")
        story_response = generate_story_text(data, user_id)  # Pass user_id here

        # Hämta värden från story_response
        story_text = story_response.get('story_text', '')
        if not story_text:
            raise ValueError("Misslyckades att generera berättelse.")

        title = story_response.get('title', 'Titel saknas')
        scenes = story_response.get('scenes', [])  # Hämta scenerna från story_response

        # 4. Generera sammanfattning och sanera titel
        summary_text = generate_summary_text(story_text) or ""
        enhanced_summary = enhance_summary_text(summary_text)

        title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
        if len(title) > 50:
            title = title[:50]

        # 5. Ladda upp berättelsen som textfil till S3
        text_url = None
        try:
            s3_text_key = f"{user_id}/text/{title}.txt"
            text_url = upload_text(story_text, s3_text_key)
        except Exception as e:
            logger.error(f"❌ Misslyckades att ladda upp textfilen: {e}")

        # 6. Hämta avatar-nyckeln från data eller sätt en standard
        avatar_url = data.get('avatar', None)
        avatar_key = os.path.splitext(avatar_url.strip('/').split('/')[-1])[0] if avatar_url else "male1"

        # 7. Generera och ladda upp omslagsbild till S3
        omslag_image_url = story_response.get('omslag_image_url', None)
        omslag_image_s3_url = None

        if omslag_image_url:
            s3_cover_key = f"{user_id}/covers/{title}.png"
            omslag_image_s3_url = upload_image_to_s3(omslag_image_url, s3_cover_key, 'ditt-s3-bucket-namn')
            logger.info(f"✅ Omslagsbild uppladdad till S3: {omslag_image_s3_url}")

        # 8. Generera ljudbok (om relevant)
        audio_s3_url = None
        if book_type in ['audiobook', 'both']:
            logger.info("🎧 Genererar ljudbok...")
            audio_s3_url = handle_audio(user_id, title, story_text, data.get('language', 'sv'), selected_tokens)

        # 9. Skapa och ladda upp PDF efter att scenbilder genererats
        pdf_url = None
        if book_type in ['pdf', 'both']:
            logger.info("📄 Skapar PDF efter att scenbilder är klara...")

            # Hämta scenbilder och backside image från story_response
            scene_images = story_response.get('scene_images', [])
            backside_image_url = story_response.get('backside_image_url', None)

            # Skapa PDF i minnet
            pdf_buffer = generate_pdf(
                story_data=story_response,
                scene_images=scene_images,
                cover_image_url=omslag_image_url,
                backside_image_url=backside_image_url,
                title=title
            )

            if pdf_buffer:
                # Ladda upp PDF till S3
                s3_pdf_key = f"{user_id}/pdf/{title}.pdf"
                pdf_url = upload_pdf_to_s3(pdf_buffer, s3_pdf_key, S3_BUCKET_NAME)
                logger.info(f"✅ PDF genererad och uppladdad till S3: {pdf_url}")

        # 10. Spara berättelsen i databasen
        new_story = Story(
            user_id=user_id,
            name=title,
            child_gender=data.get('childGender', 'tjej'),
            theme=theme,
            summary=summary_text,
            audio_url=audio_s3_url,
            text_url=text_url,
            pdf_url=pdf_url,  # PDF-url sparas endast om den finns
            omslag_image_url=omslag_image_s3_url,
        )

        db.session.add(new_story)
        db.session.commit()
        logger.info(f"✅ Story saved to database with ID: {new_story.id}")

        # 11. Returnera svar
        return jsonify({
            "message": "Berättelsen har skapats.",
            "story_id": new_story.id,
            "remaining_credits": user.credits
        }), 201

    except ValueError as ve:
        logger.error(f"Valideringsfel: {ve}")
        return jsonify({'error': f"Valideringsfel: {ve}"}), 400
    except Exception as e:
        logger.error(f"❌ Fel vid skapande av manus: {e}", exc_info=True)
        return jsonify({'error': f"Okänt fel: {e}"}), 500








def upload_binary(file_path, s3_key, file_type='application/pdf'):
    """
    Laddar upp en binär fil (t.ex. PDF) till S3 och returnerar dess URL.
    """
    s3_client = boto3.client('s3')
    with open(file_path, 'rb') as file:
        s3_client.upload_fileobj(file, S3_BUCKET_NAME, s3_key, ExtraArgs={'ContentType': file_type})

    return generate_presigned_url(s3_key)



@app.route('/generate-image', methods=['POST'])
def generate_image():
    """
    API-endpoint för att generera en bild via Leonardo AI.
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt')

        if not prompt:
            return jsonify({"error": "Ingen prompt angiven"}), 400

        logger.info(f"🎨 Skickar prompt till Leonardo: {prompt}")

        image_url = generate_some_image(prompt)

        if image_url:
            return jsonify({"image_url": image_url}), 200
        else:
            return jsonify({"error": "Bildgenerering misslyckades"}), 500

    except Exception as e:
        logger.error(f"🚨 Fel vid API-anrop: {e}")
        return jsonify({"error": f"Internt serverfel: {e}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)  # Starta API-servern på port 5000



def upload_text(content, s3_key, file_type='text/plain'):
    """
    Laddar upp en textfil eller JSON-fil till S3 och returnerar en presigned URL.
    
    file_type:
        - 'text/plain'  -> För berättelsetext (.txt)
        - 'application/json' -> För bild- och scenmetadata (.json)
    """
    # Skapa temporär fil
    safe_filename = os.path.basename(s3_key)
    temp_file_path = f"/tmp/{safe_filename}"

    with open(temp_file_path, 'w', encoding='utf-8') as file:
        file.write(content)

    s3_client = boto3.client('s3')
    s3_client.upload_file(temp_file_path, S3_BUCKET_NAME, s3_key, ExtraArgs={'ContentType': file_type})
    os.remove(temp_file_path)

    return generate_presigned_url(s3_key)


@app.route('/toggle-public', methods=['POST'])
def toggle_public():
    try:
        product_id = request.args.get('product_id')
        if not product_id:
            return jsonify({"error": "product_id saknas"}), 400

        # Hämta storyn från databasen
        story = Story.query.filter_by(id=product_id).first()
        if not story:
            return jsonify({"error": "Berättelsen hittades inte"}), 404

        # Toggla is_public
        story.is_public = not story.is_public
        db.session.commit()

        return jsonify({"message": "Publiceringsstatus uppdaterad", "is_public": story.is_public}), 200
    except Exception as e:
        logger.error(f"Fel vid toggling av publiceringsstatus: {e}", exc_info=True)
        return jsonify({"error": "Ett fel inträffade"}), 500

    








def handle_images(user_id, title, story_response, book_type):
    omslag_image_url = None
    chapter_image_urls = []

    if book_type in ['pdf', 'audiobook', 'both']:
        omslag_image = story_response.get('omslag_image')
        if omslag_image:
            omslag_image_url = process_and_upload_image(
                user_id, title, omslag_image, 'omslag'
            )

    if book_type in ['pdf', 'both']:
        insida_images = story_response.get('insida_images', [])
        for idx, img_url in enumerate(insida_images):
            chapter_image_url = process_and_upload_image(
                user_id, f"{title}_kapitel_{idx + 1}", img_url, 'kapitel'
            )
            chapter_image_urls.append(chapter_image_url)

    return omslag_image_url, chapter_image_urls


def handle_audio(user_id, title, story_text, language, max_tokens):
    """
    Handle audio generation and upload to S3.
    
    Args:
        user_id (str): User identifier
        title (str): Story title
        story_text (str): Text to convert to audio
        language (str): Target language
        max_tokens (int): Maximum number of tokens allowed
        
    Returns:
        str: Presigned S3 URL for the audio file
    """
    audio_path = None
    audio_with_music = None
    
    try:
        # Sanitize title for file naming
        sanitized_title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
        
        # Limit text length based on tokens
        max_characters = max_tokens * 4  # 4 characters per token
        truncated_text = story_text[:max_characters]
        
        logger.info(f"🎧 Generating audio for story: {sanitized_title}")
        
        # Generate TTS audio
        audio_path = audio_mixer.create_audio_with_polly(truncated_text, language)
        if not audio_path or not os.path.exists(audio_path):
            raise ValueError(f"Failed to generate TTS audio: {audio_path}")
            
        logger.info("✅ TTS audio generated successfully")
        
        # Add background music
        audio_with_music = audio_mixer.add_background_music(audio_path, output_dir=None)
        if not audio_with_music or not os.path.exists(audio_with_music):
            raise ValueError("Failed to add background music")
            
        logger.info("✅ Background music added successfully")
        
        # Prepare S3 key with sanitized title
        s3_audio_key = f"{user_id}/audio/{sanitized_title}.mp3"
        
        # Upload to S3
        if os.path.exists(audio_with_music):
            s3_client.upload_file(
                audio_with_music,
                S3_BUCKET_NAME,
                s3_audio_key,
                ExtraArgs={'ContentType': 'audio/mpeg'}
            )
            logger.info("✅ Audio file uploaded to S3 successfully")
        else:
            raise FileNotFoundError(f"Final audio file not found: {audio_with_music}")
        
        # Generate and return presigned URL
        return generate_presigned_url(s3_audio_key)
        
    except Exception as e:
        logger.error(f"Audio generation failed: {str(e)}", exc_info=True)
        raise
        
    finally:
        # Clean up temporary files
        for temp_file in [audio_path, audio_with_music]:
            try:
                if temp_file and os.path.exists(temp_file):
                    os.remove(temp_file)
                    logger.info(f"🗑️ Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file {temp_file}: {str(e)}")



def process_and_upload_image(user_id, title, img_url, image_type):
    try:
        temp_image_path = f"/tmp/{title}.png"
        img_response = requests.get(img_url)

        if img_response.status_code == 200:
            with open(temp_image_path, 'wb') as img_file:
                img_file.write(img_response.content)

            s3_key = f"{user_id}/images/{title}/{image_type}.png"
            s3_client.upload_file(temp_image_path, S3_BUCKET_NAME, s3_key, ExtraArgs={'ContentType': 'image/png'})
            os.remove(temp_image_path)

            return generate_presigned_url(s3_key)
    except Exception as e:
        logger.error(f"Fel vid bildbearbetning: {e}", exc_info=True)
        raise


@app.route('/get-book/<int:book_id>', methods=['GET'])
def get_book(book_id):
    try:
        book = Story.query.get(book_id)
        if not book:
            return jsonify({'error': 'Bok hittades inte'}), 404

        base_url = request.host_url.rstrip('/')

        response = {
            'title': book.name,
            'story': book.story_text,
            'omslagImage': f"{base_url}{book.omslag_image}" if book.omslag_image else None,
            'insidaImages': [f"{base_url}{image}" for image in book.insida_images] if book.insida_images else [],
            'audio_url': book.audio_url,
        }
        return jsonify(response)
    except Exception as e:
        logger.error(f"Fel vid hämtning av bok: {e}", exc_info=True)
        return jsonify({'error': 'Ett fel inträffade'}), 500

@app.route('/enhance-summary', methods=['POST'])
def enhance_summary():
    """
    Endpoint för att krydda en statisk text och göra den mer engagerande.
    """
    try:
        data = request.get_json()
        static_text = data.get('static_text')

        if not static_text:
            raise ValueError("Ingen text att förbättra skickades.")

        logger.info("Förbättrar texten med OpenAI...")
        enhanced_text = enhance_summary_text(static_text)  # Använd direktimporterad funktion
        logger.info("Text förbättrad framgångsrikt.")

        return jsonify({"enhanced_text": enhanced_text}), 200

    except ValueError as ve:
        logger.error(f"Valideringsfel: {ve}")
        return jsonify({'error': f"Valideringsfel: {ve}"}), 400
    except Exception as e:
        logger.error(f"Fel vid förbättring av text: {e}", exc_info=True)
        return jsonify({'error': "Okänt fel inträffade"}), 500




@app.route('/static/images/<path:filename>')
def serve_static_image(filename):
    return send_from_directory('static/images', filename)

def extract_s3_key(url_or_key):
    """
    Extraherar S3-nyckeln från en URL om det är en URL, annars returnerar input som det är.
    """
    if url_or_key.startswith("https://"):
        # Extrahera nyckeln från URL
        parsed_url = urllib.parse.urlparse(url_or_key)
        return parsed_url.path.lstrip('/')  # Ta bort ledande '/'
    return url_or_key


def generate_presigned_image_url(s3_key):
    """
    Genererar en presigned URL specifikt för bilder.
    """
    try:
        logger.info(f"Generating presigned URL for original key: {s3_key}")
        # Avkoda URL-kodad nyckel
        s3_key = unquote(s3_key)
        logger.info(f"Decoded S3 key: {s3_key}")
        
        # Generera presigned URL
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=3600  # URL giltig i 1 timme
        )
        logger.info(f"Generated presigned URL: {url}")
        return url
    except Exception as e:
        logger.error(f"Error generating presigned image URL for key {s3_key}: {e}")
        return None

@app.route('/api/create-user', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        user_id = data.get('id')  # Cognito userSub används här
        username = data.get('username')
        email = data.get('email')
        credits = data.get('credits', 1000)

        if not all([user_id, username, email]):
            return jsonify({"error": "Alla fält måste fyllas i"}), 400

        # Kontrollera om användaren redan finns
        existing_user = User.query.filter_by(id=user_id).first()
        if existing_user:
            return jsonify({"error": "Användaren finns redan"}), 400

        # Skapa och spara användaren
        new_user = User(
            id=user_id,  # Använd Cognito's userSub
            username=username,
            email=email,
            credits=credits
        )
        db.session.add(new_user)
        db.session.commit()

        logger.info(f"Användare skapad: {user_id}")
        return jsonify({"message": "Användare skapad"}), 201
    except Exception as e:
        logger.error(f"Fel vid skapande av användare: {e}")
        return jsonify({"error": "Serverfel"}), 500



@app.route('/api/check-username', methods=['GET'])
def check_username():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Användarnamn krävs"}), 400

    user_exists = User.query.filter_by(username=username).first()
    if user_exists:
        return jsonify({"available": False}), 200
    return jsonify({"available": True}), 200


@app.route('/user/stories', methods=['GET'])
def get_stories():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID saknas"}), 400

    stories = Story.query.filter_by(user_id=user_id).all()
    
    # Om inga berättelser hittas, returnera en tom lista istället för ett fel
    if not stories:
        return jsonify({"stories": []}), 200

    result = []
    for story in stories:
        if isinstance(story.insida_image_urls, str):
            try:
                insida_image_urls = json.loads(story.insida_image_urls)
            except json.JSONDecodeError as e:
                logger.error(f"JSON Decode Error: {e}")
                insida_image_urls = []
        else:
            insida_image_urls = story.insida_image_urls or []

       # omslag_s3_key = extract_s3_key(story.omslag_image_url) if story.omslag_image_url else None
       # omslag_image_url = generate_presigned_image_url(omslag_s3_key) if omslag_s3_key else None

        if story.omslag_image_url and "s3.amazonaws.com" in story.omslag_image_url:
            omslag_s3_key = extract_s3_key(story.omslag_image_url)
            omslag_image_url = generate_presigned_image_url(omslag_s3_key) if omslag_s3_key else None
        else:
            omslag_image_url = story.omslag_image_url  # Om bilden fortfarande är på Leonardo AI


        story_data = {
        "id": story.id,
        "name": story.name,
        
        "summary": story.summary,
        "omslag_image_url": omslag_image_url,
        "audio_url": generate_presigned_image_url(extract_s3_key(story.audio_url)) if story.audio_url else None,
        "text_url": generate_presigned_image_url(extract_s3_key(story.text_url)) if story.text_url else None,
        "pdf_url": generate_presigned_image_url(extract_s3_key(story.pdf_url)) if story.pdf_url else None,  # 🔥 Lägg till PDF-URL här
        "is_public": story.is_public
    }

        result.append(story_data)

    return jsonify({"stories": result}), 200



@app.route('/api/get-credits', methods=['GET'])
def get_credits():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            logger.error("Användar-ID saknas i förfrågan.")
            return jsonify({"error": "Användar-ID krävs"}), 400

        user = User.query.filter_by(id=user_id).first()
        if not user:
            logger.error(f"Användare med ID {user_id} hittades inte.")
            return jsonify({"error": "Användare hittades inte"}), 404

        logger.info(f"Credits för användare {user_id}: {user.credits}")
        return jsonify({"credits": user.credits}), 200
    except Exception as e:
        logger.error(f"Fel vid hämtning av credits: {e}")
        return jsonify({"error": "Serverfel"}), 500









@app.route('/download-audio/<filename>', methods=['GET'])
def download_audio(filename):
    try:
        title = request.args.get('title', 'audiobook')
        
        # Sanera titeln för att skapa ett giltigt filnamn
        sanitized_title = ''.join(c for c in title if c.isalnum() or c in (' ', '_')).rstrip()
        sanitized_title = sanitized_title.replace(' ', '_')
        
        # Fullständig sökväg till ljudfilen
        audio_directory = os.path.join(basedir, 'static', 'audio')
        
        # Kontrollera att filen existerar
        file_path = os.path.join(audio_directory, filename)
        if not os.path.exists(file_path):
            logger.error(f"Filen {file_path} finns inte.")
            return jsonify({'error': 'Filen finns inte'}), 404
        
        # Skicka filen med rätt headers för nedladdning
        return send_from_directory(
            directory=audio_directory,
            filename=filename,
            as_attachment=True,
            download_name=f"{sanitized_title}.mp3"  # Flask >= 2.0
        )
    
    except Exception as e:
        logger.error(f"Fel vid nedladdning av ljudfil: {e}", exc_info=True)
        return jsonify({'error': 'Fel vid nedladdning av ljudfil'}), 500

    
def generate_images(user_id, title, chapters_text, cover_image_path, inside_image_paths, placeholder_image_path):
    try:
        # Sätt grundstorlek (A4, i pixlar vid 300 DPI)
        width, height = 2480, 3508  # A4 (300 DPI)
        image_dir = f"/tmp/{user_id}/{title}"
        os.makedirs(image_dir, exist_ok=True)
        
        uploaded_image_urls = []

        # Omslagssida
        cover_image_output = os.path.join(image_dir, "1.png")
        cover_page = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(cover_page)

        # Lägg till omslagsbilden
        if os.path.exists(cover_image_path):
            cover_image = Image.open(cover_image_path)
            cover_image = cover_image.resize((width, int(height * 0.7)), Image.Resampling.LANCZOS)
            cover_page.paste(cover_image, (0, 0))

        # Lägg till titeln
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 120)  # macOS exempel
        except OSError:
            font = ImageFont.load_default()  # Fallback till standardfont
        text_position = (width // 2, int(height * 0.75))
        draw.text(text_position, title, fill="black", font=font, anchor="ms")

        # Spara omslagssidan
        cover_page.save(cover_image_output)
        uploaded_image_urls.append(upload_to_s3(cover_image_output, f"{user_id}/images/{title}/1.png"))

        # Generera insidesidor
        for i, chapter_text in enumerate(chapters_text):
            inside_image_output = os.path.join(image_dir, f"{i + 2}.png")
            page = Image.new("RGB", (width, height), "white")
            draw = ImageDraw.Draw(page)

            # Lägg till insidesbild
            if i < len(inside_image_paths) and os.path.exists(inside_image_paths[i]):
                inside_image = Image.open(inside_image_paths[i])
                inside_image = inside_image.resize((width, int(height * 0.5)), Image.Resampling.LANCZOS)
                page.paste(inside_image, (0, 0))

            # Lägg till text
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 60)  # macOS exempel
            except OSError:
                font = ImageFont.load_default()  # Fallback till standardfont
            text_position = (100, int(height * 0.55))
            draw.multiline_text(text_position, chapter_text, fill="black", font=font, spacing=20)

            # Spara insidesidan
            page.save(inside_image_output)
            uploaded_image_urls.append(upload_to_s3(inside_image_output, f"{user_id}/images/{title}/{i + 2}.png"))

        # Rensa temporära filer
        for root, _, files in os.walk(image_dir):
            for file in files:
                os.remove(os.path.join(root, file))

        os.rmdir(image_dir)
        return uploaded_image_urls

    except Exception as e:
        logger.error(f"Error generating images: {e}", exc_info=True)
        return None


def upload_to_s3(local_path, s3_key):
    try:
        s3_client.upload_file(
            local_path,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'image/png'}
        )
        return s3_key  # Endast S3-nyckeln returneras
    except Exception as e:
        logger.error(f"Failed to upload to S3: {e}")
        return None

@app.route('/public-books', methods=['GET'])
def get_public_books():
    stories = Story.query.filter_by(is_public=True).all()

    result = []
    for story in stories:
        # Samma logik som i get_stories
        if isinstance(story.insida_image_urls, str):
            try:
                insida_image_urls = json.loads(story.insida_image_urls)
            except json.JSONDecodeError as e:
                logger.error(f"JSON Decode Error: {e}")
                insida_image_urls = []
        elif isinstance(story.insida_image_urls, list):
            insida_image_urls = story.insida_image_urls
        else:
            insida_image_urls = []

        omslag_s3_key = extract_s3_key(story.omslag_image_url) if story.omslag_image_url else None
        omslag_image_url = generate_presigned_image_url(omslag_s3_key) if omslag_s3_key else None

        story_data = {
            "id": story.id,
            "name": story.name,
            "insida_image_urls": [
                generate_presigned_image_url(extract_s3_key(url)) for url in insida_image_urls
            ],
            "summary": story.summary,
            "omslag_image_url": omslag_image_url,
            "audio_url": generate_presigned_image_url(extract_s3_key(story.audio_url)) if story.audio_url else None,
            "text_url": generate_presigned_image_url(extract_s3_key(story.text_url)) if story.text_url else None,
            "is_public": story.is_public
        }
        result.append(story_data)

    return jsonify({"books": result}), 200




if __name__ == '__main__':
    app.run(debug=True)