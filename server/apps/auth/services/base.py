from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import APIException, AuthenticationFailed, NotFound, ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import DeviceLoginSession

Account = get_user_model()


class ConflictError(APIException):
    status_code = 409
    default_detail = "Resource conflict."
    default_code = "conflict"


def get_tokens_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def build_auth_response(user) -> dict:
    return {
        "tokens": get_tokens_for_user(user),
        "account": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    }


def sign_out_with_refresh(refresh_token: str) -> dict:
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as exc:
        raise ValidationError("Invalid token.") from exc
    return {"message": "Signed out successfully."}


def refresh_tokens(refresh_token: str) -> dict:
    try:
        token = RefreshToken(refresh_token)

        user_id = token.payload.get("user_id")
        try:
            user = Account.objects.get(pk=user_id)
        except Account.DoesNotExist as exc:
            raise AuthenticationFailed("User not found.") from exc

        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        return {"access": str(token.access_token), "refresh": str(token)}
    except TokenError as exc:
        raise AuthenticationFailed("Invalid or expired token.") from exc


def device_start() -> dict:
    from django.conf import settings

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
            status=DeviceLoginSession.Status.PENDING,
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