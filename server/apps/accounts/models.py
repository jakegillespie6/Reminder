from django.contrib.auth.models import AbstractUser
from django.db import models


class Account(AbstractUser):
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    class Meta:
        db_table = 'accounts'