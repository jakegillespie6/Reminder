from datetime import timedelta
from secrets import token_urlsafe

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.exceptions import APIException, AuthenticationFailed, NotFound, ValidationError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken

from ..models import GuestSession

Account = get_user_model()

GUEST_PASS_TTL_SECONDS = 30 * 60
GUEST_PASS_SCOPES = ["items:create", "items:update", "filters:write"]


class GoneError(APIException):
    status_code = 410
    default_detail = "Expired or invalid resource."
    default_code = "gone"


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
        raise GoneError("Expired or invalid pass.")

    cache.delete(f"guest_pass:{code}")

    try:
        issuer = Account.objects.get(id=data["issuer_id"])
    except Account.DoesNotExist as exc:
        raise NotFound("Issuing user not found.") from exc

    expires_at = timezone.now() + timedelta(seconds=GUEST_PASS_TTL_SECONDS)
    guest_session = GuestSession.objects.create(issuer=issuer, expires_at=expires_at)

    token = AccessToken()
    token["guest"] = True
    token["guest_session_id"] = str(guest_session.id)
    token["scopes"] = GUEST_PASS_SCOPES
    token.set_exp(lifetime=timedelta(seconds=GUEST_PASS_TTL_SECONDS))

    return {
        "access": str(token),
        "token_type": "Bearer",
        "expires_in": GUEST_PASS_TTL_SECONDS,
    }


class GuestPrincipal:
    def __init__(self, session):
        self.session = session

    @property
    def id(self):
        return self.session.id

    @property
    def issuer(self):
        return self.session.issuer

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_guest(self):
        return True


class GuestJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)

        if not validated_token.get("guest"):
            return None

        session_id = validated_token.get("guest_session_id")
        if not session_id:
            raise AuthenticationFailed("Invalid guest token.")

        try:
            session = GuestSession.objects.select_related("issuer").get(id=session_id)
        except GuestSession.DoesNotExist as exc:
            raise AuthenticationFailed("Guest session not found.") from exc

        if not session.is_valid:
            raise AuthenticationFailed("Guest session expired or revoked.")

        return (GuestPrincipal(session), validated_token)