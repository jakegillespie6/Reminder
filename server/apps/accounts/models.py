from django.contrib.auth.models import AbstractUser
from django.db import models


class Account(AbstractUser):
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    google_access_token = models.TextField(blank=True)
    google_refresh_token = models.TextField(blank=True)
    google_token_expiry = models.DateTimeField(null=True, blank=True)
    google_sync_token = models.TextField(blank=True)  # nextSyncToken from Google
    google_channel_id = models.CharField(max_length=64, blank=True)  # Watch channel ID
    google_channel_expiration = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'accounts'