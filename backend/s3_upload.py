import boto3
from io import BytesIO
from PIL import Image
import requests
import logging

logger = logging.getLogger(__name__)

def upload_image_to_s3(image_url, s3_key, bucket_name):
    """
    Laddar upp en bild direkt från en URL till S3 utan att spara den lokalt.
    """
    try:
        # Ladda ner bilden direkt från URL
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            # Öppna bilden med PIL för att säkerställa att den är giltig
            img = Image.open(BytesIO(response.content))
            img_buffer = BytesIO()
            img.save(img_buffer, format="PNG")  # Spara bilden i minnet som PNG
            img_buffer.seek(0)

            # Ladda upp till S3
            s3 = boto3.client('s3')
            s3.upload_fileobj(img_buffer, bucket_name, s3_key, ExtraArgs={'ContentType': 'image/png'})
            logger.info(f"✅ Bild uppladdad till S3: {s3_key}")
            return f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        else:
            logger.error(f"❌ Kunde inte ladda ner bild från {image_url}")
            return None
    except Exception as e:
        logger.error(f"❌ Fel vid uppladdning av bild till S3: {e}")
        return None


def upload_pdf_to_s3(pdf_buffer, s3_key, bucket_name):
    """
    Laddar upp en PDF-fil från en BytesIO-buffer till S3.
    """
    try:
        s3 = boto3.client('s3')
        s3.upload_fileobj(pdf_buffer, bucket_name, s3_key, ExtraArgs={'ContentType': 'application/pdf'})
        logger.info(f"✅ PDF uppladdad till S3: {s3_key}")
        return f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
    except Exception as e:
        logger.error(f"❌ Fel vid uppladdning av PDF till S3: {e}")
        return None