from celery import shared_task
from .services.google_sync import renew_expiring_channels


@shared_task
def renew_google_channels_task():
    """Daily task to renew expiring Google Calendar watch channels."""
    renew_expiring_channels()