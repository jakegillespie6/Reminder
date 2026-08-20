from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests
from google.oauth2 import id_token
from rest_framework.exceptions import AuthenticationFailed, NotFound, ValidationError

from .base import build_auth_response, ConflictError

Account = get_user_model()


def verify_google_token(token: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID,
        )
    except ValueError as exc:
        raise AuthenticationFailed("Invalid token.") from exc

    if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
        raise AuthenticationFailed("Invalid issuer.")

    if not idinfo.get("email_verified", False):
        raise AuthenticationFailed("Email not verified by Google.")

    return idinfo


def sign_in_with_google(token: str) -> dict:
    idinfo = verify_google_token(token)
    google_id = idinfo["sub"]

    try:
        user = Account.objects.get(google_id=google_id)
    except Account.DoesNotExist as exc:
        raise NotFound("No account found. Please sign up first.") from exc

    return build_auth_response(user)


def sign_up_with_google(token: str) -> dict:
    idinfo = verify_google_token(token)

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    first_name = idinfo.get("given_name", "")
    last_name = idinfo.get("family_name", "")

    if not email:
        raise ValidationError("Google account email is required.")

    if Account.objects.filter(google_id=google_id).exists():
        raise ConflictError("Account already exists. Please sign in.")

    if Account.objects.filter(email=email).exclude(google_id=google_id).exists():
        raise ConflictError("An account with this email already exists.")

    user = Account.objects.create_user(
        google_id=google_id,
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    return build_auth_response(user)