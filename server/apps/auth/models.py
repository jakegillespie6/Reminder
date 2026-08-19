import uuid
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


def device_session_expires_at():
    return timezone.now() + timedelta(minutes=5)


class DeviceLoginSession(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        APPROVED = "approved"
        CONSUMED = "consumed"
        EXPIRED = "expired"

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    poll_token = models.UUIDField(default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    expires_at = models.DateTimeField(default=device_session_expires_at)
    created_at = models.DateTimeField(auto_now_add=True)
