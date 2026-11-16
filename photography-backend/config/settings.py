from pathlib import Path
import os

from datetime import timedelta
from dotenv import load_dotenv


BASE_DIR=Path(__file__).resolve().parent.parent
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"
load_dotenv(BASE_DIR/'.env')
SECRET_KEY=os.getenv('DJANGO_SECRET_KEY','development-only-change-this-key')
DEBUG=os.getenv('DJANGO_DEBUG','False').lower()=='true'
ALLOWED_HOSTS=os.getenv('DJANGO_ALLOWED_HOSTS','localhost,127.0.0.1').split(',')
INSTALLED_APPS=['django.contrib.admin','reviews','notifications','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','rest_framework','rest_framework_simplejwt.token_blacklist','corsheaders','django_filters','accounts','contacts','bookings','portfolio','services']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','corsheaders.middleware.CorsMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='config.urls'
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application'
DATABASES={'default':{'ENGINE':'django.db.backends.mysql','NAME':os.getenv('DB_NAME','photography_db'),'USER':os.getenv('DB_USER','root'),'PASSWORD':os.getenv('DB_PASSWORD'),'HOST':os.getenv('DB_HOST','127.0.0.1'),'PORT':os.getenv('DB_PORT','3306'),'OPTIONS':{'charset':'utf8mb4'}}}
AUTH_USER_MODEL='accounts.User'
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],

    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],

    "DEFAULT_THROTTLE_RATES": {
        "anon": "1000/hour" if DEBUG else "30/hour",
        "user": "2000/hour" if DEBUG else "300/hour",

        "contact": "100/hour" if DEBUG else "5/hour",
        "booking": "100/hour" if DEBUG else "10/hour",

        # Existing login / refresh scope
        "auth": "1000/hour" if DEBUG else "10/hour",

        # Email verification
        "auth_register": "5/hour",
        "auth_verify": "10/hour",
        "auth_resend": "5/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ["JWT_SIGNING_KEY"],

    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",

    "UPDATE_LAST_LOGIN": False,
}
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=CORS_ALLOWED_ORIGINS
LANGUAGE_CODE='en-us';TIME_ZONE='Asia/Kolkata';USE_I18N=True;USE_TZ=True
STATIC_URL='static/'
MEDIA_URL='media/';MEDIA_ROOT=BASE_DIR/'media'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
SESSION_COOKIE_HTTPONLY=True
CSRF_COOKIE_HTTPONLY=False
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE='Lax'
SESSION_COOKIE_SAMESITE='Lax'
SECURE_CONTENT_TYPE_NOSNIFF=True
CSRF_COOKIE_NAME = "csrftoken"

# Email configuration

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend"
)

EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com"
)

EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS", "True"
).lower() == "true"

EMAIL_USE_SSL = os.getenv(
    "EMAIL_USE_SSL", "False"
).lower() == "true"

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "Lenscraft Studio <noreply@lenscraft.local>"
)

EMAIL_TIMEOUT = 20