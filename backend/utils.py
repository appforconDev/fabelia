import boto3
import logging
import os
import re 

# Logger
logger = logging.getLogger(__name__)

# S3-konfiguration
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("AWS_DEFAULT_REGION")

# Initiera S3-klient
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=S3_REGION
)


def sanitize_filename(filename):
    """ Tar bort specialtecken och ersätter mellanslag med understreck. """
    return ''.join(c for c in filename if c.isalnum() or c in (' ', '_')).rstrip().replace(' ', '_')


def generate_presigned_url(s3_key, expiration=3600):
    """
    Genererar en presigned URL för att hämta en fil från S3.
    """
    if not s3_key:
        logger.error("S3-nyckeln är tom eller ogiltig.")
        return None

    try:
        logger.info(f"Genererar presigned URL för S3-nyckel: {s3_key}")
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': s3_key,
            },
            ExpiresIn=expiration
        )
        logger.info(f"Presigned URL genererad för {s3_key}: {presigned_url}")
        return presigned_url
    except Exception as e:
        logger.error(f"Fel vid generering av Presigned URL för {s3_key}: {e}", exc_info=True)
        return None

def generate_presigned_upload_url(s3_key, expiration=3600):
    """
    Genererar en presigned URL för att ladda upp en fil till S3.
    """
    if not s3_key:
        logger.error("S3-nyckeln är tom eller ogiltig.")
        return None, None

    try:
        logger.info(f"Genererar presigned upload URL för S3-nyckel: {s3_key}")
        response = s3_client.generate_presigned_post(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            ExpiresIn=expiration
        )
        logger.info(f"Presigned upload URL genererad för {s3_key}")
        return response['url'], response.get('fields', {})
    except Exception as e:
        logger.error(f"Fel vid generering av Presigned Upload URL: {e}", exc_info=True)
        return None, None
