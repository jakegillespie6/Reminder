from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from google.auth.transport import requests
from google.oauth2 import id_token
from rest_framework.exceptions import APIException, AuthenticationFailed, NotFound, ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from .models import DeviceLoginSession

Account = get_user_model()
from datetime import timedelta
from secrets import token_urlsafe
from django.core.cache import cache
GUEST_PASS_TTL_SECONDS = 30 * 60
GUEST_PASS_SCOPES = ["items:create", "items:update", "filters:write"]


class GoneError(APIException):
    status_code = 410
    default_detail = "Expired or invalid resource."
    default_code = "gone"


class ConflictError(APIException):
    status_code = 409
    default_detail = 'Resource conflict.'
    default_code = 'conflict'


def get_tokens_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def verify_google_token(token: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID
        )
    except ValueError as exc:
        raise AuthenticationFailed('Invalid token.') from exc

    if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
        raise AuthenticationFailed('Invalid issuer.')

    if not idinfo.get('email_verified', False):
        raise AuthenticationFailed('Email not verified by Google.')

    return idinfo


def build_auth_response(user) -> dict:
    return {
        'tokens': get_tokens_for_user(user),
        'account': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }


def sign_in_with_google(token: str) -> dict:
    idinfo = verify_google_token(token)
    google_id = idinfo['sub']

    try:
        user = Account.objects.get(google_id=google_id)
    except Account.DoesNotExist as exc:
        raise NotFound('No account found. Please sign up first.') from exc

    return build_auth_response(user)


def sign_up_with_google(token: str) -> dict:
    idinfo = verify_google_token(token)

    google_id = idinfo['sub']
    email = idinfo.get('email')
    first_name = idinfo.get('given_name', '')
    last_name = idinfo.get('family_name', '')

    if not email:
        raise ValidationError('Google account email is required.')

    if Account.objects.filter(google_id=google_id).exists():
        raise ConflictError('Account already exists. Please sign in.')

    if Account.objects.filter(email=email).exclude(google_id=google_id).exists():
        raise ConflictError('An account with this email already exists.')

    user = Account.objects.create_user(
        google_id=google_id,
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    return build_auth_response(user)


def sign_out_with_refresh(refresh_token: str) -> dict:
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as exc:
        raise ValidationError('Invalid token.') from exc

    return {'message': 'Signed out successfully.'}


def refresh_tokens(refresh_token: str) -> dict:
    try:
        token = RefreshToken(refresh_token)

        user_id = token.payload.get('user_id')
        try:
            user = Account.objects.get(pk=user_id)
        except Account.DoesNotExist as exc:
            raise AuthenticationFailed('User not found.') from exc

        if not user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        return {
            'access': str(token.access_token),
            'refresh': str(token),
        }
    except TokenError as exc:
        raise AuthenticationFailed('Invalid or expired token.') from exc


def device_start() -> dict:
    s = DeviceLoginSession.objects.create()
    return {
        "session_id": str(s.session_id),
        "poll_token": str(s.poll_token),
        "verification_uri": f"{settings.FRONTEND_URL}/device/verify/{s.session_id}",
        "expires_at": s.expires_at,
    }

def device_approve(session_id: str, user) -> dict:
    try:
        s = DeviceLoginSession.objects.get(
            session_id=session_id,
            status=DeviceLoginSession.Status.PENDING
        )
    except DeviceLoginSession.DoesNotExist as exc:
        raise NotFound("Session not found or already used.") from exc

    if s.expires_at < timezone.now():
        s.status = DeviceLoginSession.Status.EXPIRED
        s.save(update_fields=["status"])
        raise ValidationError("Session expired.")

    s.status = DeviceLoginSession.Status.APPROVED
    s.approved_user = user
    s.save(update_fields=["status", "approved_user"])
    return {"message": "Device approved."}


def device_poll(session_id: str, poll_token: str) -> dict:
    try:
        s = DeviceLoginSession.objects.get(session_id=session_id, poll_token=poll_token)
    except DeviceLoginSession.DoesNotExist as exc:
        raise AuthenticationFailed("Invalid session or poll token.") from exc

    if s.expires_at < timezone.now():
        s.status = DeviceLoginSession.Status.EXPIRED
        s.save(update_fields=["status"])
        raise AuthenticationFailed("Session expired.")

    if s.status == DeviceLoginSession.Status.PENDING:
        return {"status": "pending"}

    if s.status != DeviceLoginSession.Status.APPROVED or not s.approved_user:
        raise AuthenticationFailed("Invalid session state.")

    s.status = DeviceLoginSession.Status.CONSUMED
    s.save(update_fields=["status"])
    return {"status": "approved", **build_auth_response(s.approved_user)}


def create_guest_pass(issuer_user) -> dict:
    code = token_urlsafe(32)
    expires_at = timezone.now() + timedelta(seconds=GUEST_PASS_TTL_SECONDS)

    cache.set(
        f"guest_pass:{code}",
        {"issuer_id": issuer_user.id, "expires_at": expires_at.isoformat()},
        timeout=GUEST_PASS_TTL_SECONDS,
    )

    frontend_url = getattr(settings, "CLIENT_URL", None) or settings.FRONTEND_URL
    return {
        "code": code,
        "redeem_url": f"{frontend_url}/guest/redeem/{code}",
        "issued_at": timezone.now().isoformat(),
        "expires_at": expires_at.isoformat(),
        "expires_in": GUEST_PASS_TTL_SECONDS,
    }


def redeem_guest_pass(code: str) -> dict:
    if not code:
        raise ValidationError("code is required")

    data = cache.get(f"guest_pass:{code}")
    if not data:
        raise GoneError("expired or invalid pass")

    # one-time use
    cache.delete(f"guest_pass:{code}")

    try:
        issuer = Account.objects.get(id=data["issuer_id"])
    except Account.DoesNotExist as exc:
        raise NotFound("Issuing user not found.") from exc

    token = AccessToken.for_user(issuer)
    token["guest"] = True
    token["scopes"] = GUEST_PASS_SCOPES
    token.set_exp(lifetime=timedelta(seconds=GUEST_PASS_TTL_SECONDS))

    return {
        "access": str(token),
        "token_type": "Bearer",
        "expires_in": GUEST_PASS_TTL_SECONDS,
    }