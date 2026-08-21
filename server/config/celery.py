# Add to your Celery beat schedule

CELERY_BEAT_SCHEDULE = {
    'renew-google-channels-daily': {
        'task': 'apps.calendar_events.tasks.renew_google_channels_task',
        'schedule': 86400.0,  # Every 24 hours
    },
}