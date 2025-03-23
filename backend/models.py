from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)
    credits = db.Column(db.Integer, default=1000)
    stripe_account_id = db.Column(db.String(120), unique=True, nullable=True, name='stripe_account_id')

    promo_codes = db.relationship('PromoCode', back_populates='user', lazy=True)
    promo_code_usages = db.relationship('PromoCodeUsage', back_populates='user', lazy=True)
    stories = db.relationship('Story', back_populates='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Story(db.Model):
    __tablename__ = 'story'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String,
        db.ForeignKey('user.id', name='fk_story_user_id'),
        nullable=False
    )
    name = db.Column(db.String, nullable=False)
    child_gender = db.Column(db.String)
    theme = db.Column(db.String, default="christmas")
    story_text = db.Column(db.Text)
    audio_url = db.Column(db.String)
    pdf_url = db.Column(db.String)
    text_url = db.Column(db.String)
    omslag_image_url = db.Column(db.String)
    insida_image_urls = db.Column(db.JSON)
    image_urls = db.Column(db.JSON)
    summary = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)

    user = db.relationship('User', back_populates='stories')
    scenes = db.relationship('Scene', back_populates='story', lazy=True, cascade="all, delete-orphan")  # Koppling till scener


class Scene(db.Model):
    """
    Tabell för att lagra scener kopplade till en berättelse.
    """
    __tablename__ = 'scene'

    id = db.Column(db.Integer, primary_key=True)
    story_id = db.Column(db.Integer, db.ForeignKey('story.id', name='fk_scene_story_id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)  # Ordningen i berättelsen
    avatar = db.Column(db.String, nullable=False)  # Exempel: "male1"
    situation = db.Column(db.String, nullable=False)  # Exempel: "happy"
    background = db.Column(db.String, nullable=False)  # Exempel: "forest"
    text = db.Column(db.Text, nullable=False)  # Texten för scenen

    story = db.relationship('Story', back_populates='scenes')  # Koppling till berättelsen





class PromoCode(db.Model):
    __tablename__ = 'promo_codes'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, name='uq_code')
    discount = db.Column(db.Integer, nullable=False)
    uses = db.Column(db.Integer, default=0, nullable=False)
    max_uses = db.Column(db.Integer, nullable=True)
    email = db.Column(db.String(120), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    is_indefinite = db.Column(db.Boolean, default=False)
    user_id = db.Column(
        db.String,
        db.ForeignKey('user.id', name='fk_promo_codes_user_id'),
        nullable=False
    )

    user = db.relationship('User', back_populates='promo_codes')
    usages = db.relationship('PromoCodeUsage', back_populates='promo_code', lazy=True)


class Tier(db.Model):
    __tablename__ = 'tiers'

    id = db.Column(db.Integer, primary_key=True)
    credits = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String, nullable=True)


class PromoCodeUsage(db.Model):
    __tablename__ = 'promo_code_usage'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String,
        db.ForeignKey('user.id', name='fk_promo_code_usage_user_id'),
        nullable=False
    )
    promo_code_id = db.Column(
        db.Integer,
        db.ForeignKey('promo_codes.id', name='fk_promo_code_usage_promo_code_id'),
        nullable=False
    )
    tier_id = db.Column(
        db.Integer,
        db.ForeignKey('tiers.id', name='fk_promo_code_usage_tier_id'),
        nullable=True
    )

    user = db.relationship('User', back_populates='promo_code_usages')
    promo_code = db.relationship('PromoCode', back_populates='usages')
    tier = db.relationship('Tier', lazy=True)
