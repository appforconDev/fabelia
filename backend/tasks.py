from celery import Celery
from sqlalchemy.exc import SQLAlchemyError
from models import db, Story
from utils import generate_presigned_url, generate_presigned_upload_url, S3_BUCKET_NAME


# Initiera Celery
celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def refresh_presigned_urls_task(batch_size=100):
    """
    Uppdaterar presigned URLs för produkter (PDF, ljudfiler) i databasen i batchar.
    """
    offset = 0
    total_updated = 0

    while True:
        # Hämta berättelser i batchar
        stories = Story.query.offset(offset).limit(batch_size).all()
        if not stories:
            print(f"Completed updating presigned URLs. Total updated: {total_updated}")
            break

        for story in stories:
            try:
                # Lista över produkttyper som ska uppdateras
                product_types = {
                    "pdf_url": story.pdf_url,
                    "audio_url": story.audio_url,
                }

                for product_type, url in product_types.items():
                    if url:
                        # Extrahera S3-nyckeln från URL:en
                        s3_key = url.split(f"{S3_BUCKET_NAME}/")[-1]
                        # Generera en ny presigned URL
                        new_presigned_url = generate_presigned_url(s3_key)

                        if not new_presigned_url:
                            raise Exception(f"Failed to generate presigned URL for {product_type} in story ID: {story.id}")

                        # Uppdatera den specifika produktens URL i databasen
                        setattr(story, product_type, new_presigned_url)
                        total_updated += 1

            except Exception as e:
                # Logga eventuella fel för specifik berättelse
                print(f"Error updating story ID: {story.id}. Error: {e}")

        try:
            # Spara ändringar i databasen
            db.session.commit()
            print(f"Batch offset {offset} processed successfully.")
        except SQLAlchemyError as db_error:
            # Hantera eventuella databasfel
            db.session.rollback()
            print(f"Database error on offset {offset}: {db_error}")

        # Flytta offset
        offset += batch_size

    return f"Task completed. Total presigned URLs updated: {total_updated}"
