import uuid
from datetime import datetime, timedelta, timezone

from django.conf import settings
from django.db import transaction
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from apps.accounts.models import Account
from apps.calendar_events.models import CalendarEvent


def get_google_service(account: Account):
    """Build Google Calendar API service for an account."""
    if not account.google_id:
        return None

    credentials = Credentials(
        token=account.google_access_token,
        refresh_token=account.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
    )

    # Check if token needs refresh
    if account.google_token_expiry and account.google_token_expiry < datetime.now(timezone.utc):
        credentials.refresh(Request())
        account.google_access_token = credentials.token
        account.google_token_expiry = credentials.expiry
        account.save(update_fields=["google_access_token", "google_token_expiry"])

    return build("calendar", "v3", credentials=credentials)


def parse_google_datetime(dt_dict):
    """Parse Google's dateTime or date field."""
    if not dt_dict:
        return None, None

    if "dateTime" in dt_dict:
        dt_str = dt_dict["dateTime"]
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")), CalendarEvent.TimingType.EXACT
    elif "date" in dt_dict:
        date = datetime.strptime(dt_dict["date"], "%Y-%m-%d")
        return date.replace(tzinfo=timezone.utc), CalendarEvent.TimingType.ANYTIME

    return None, None


def parse_google_recurrence(recurrence_rules):
    """Parse Google RRULE to our simple recurrence model."""
    if not recurrence_rules:
        return CalendarEvent.Recurrence.NONE, None

    for rule in recurrence_rules:
        if not rule.startswith("RRULE:"):
            continue
        rule = rule[6:]
        parts = dict(p.split("=") for p in rule.split(";") if "=" in p)

        freq = parts.get("FREQ", "").upper()
        freq_map = {
            "DAILY": CalendarEvent.Recurrence.DAILY,
            "WEEKLY": CalendarEvent.Recurrence.WEEKLY,
            "MONTHLY": CalendarEvent.Recurrence.MONTHLY,
            "YEARLY": CalendarEvent.Recurrence.YEARLY,
        }
        recurrence = freq_map.get(freq, CalendarEvent.Recurrence.NONE)

        recurrence_end = None
        if "UNTIL" in parts:
            until_str = parts["UNTIL"]
            recurrence_end = datetime.strptime(until_str[:8], "%Y%m%d").date()

        return recurrence, recurrence_end

    return CalendarEvent.Recurrence.NONE, None


def calculate_duration(start_dt, end_dict):
    """Calculate duration in seconds from end time."""
    if not end_dict or not start_dt:
        return None

    end_dt, _ = parse_google_datetime(end_dict)
    if end_dt:
        delta = end_dt - start_dt
        seconds = int(delta.total_seconds())
        return seconds if seconds > 0 else None
    return None


def upsert_google_event(g_event):
    """Create or update a single Google event. Returns (obj, created, deleted)."""
    external_id = g_event["id"]
    status = g_event.get("status", "confirmed")

    # Handle cancelled/deleted events
    if status == "cancelled":
        deleted_count, _ = CalendarEvent.objects.filter(
            source=CalendarEvent.Source.GOOGLE,
            external_id=external_id,
        ).delete()
        return None, False, deleted_count > 0

    start_dict = g_event.get("start", {})
    start_at, timing_type = parse_google_datetime(start_dict)

    if not start_at:
        return None, False, False

    recurrence, recurrence_end = parse_google_recurrence(g_event.get("recurrence", []))
    duration_seconds = calculate_duration(start_at, g_event.get("end"))

    defaults = {
        "title": g_event.get("summary", "(No title)")[:64],
        "start_at": start_at,
        "timing_type": timing_type,
        "duration_seconds": duration_seconds,
        "recurrence": recurrence,
        "recurrence_end": recurrence_end,
    }

    obj, created = CalendarEvent.objects.update_or_create(
        source=CalendarEvent.Source.GOOGLE,
        external_id=external_id,
        defaults=defaults,
    )

    return obj, created, False


@transaction.atomic
def full_sync_google_calendar(account: Account):
    """
    Perform a full sync for an account.
    Clears existing Google events and fetches all from Google.
    Returns (created_count, sync_token)
    """
    service = get_google_service(account)
    if not service:
        raise ValueError("Google service not available for this account")

    # Clear existing Google events for this account
    CalendarEvent.objects.filter(source=CalendarEvent.Source.GOOGLE).delete()

    created_count = 0
    page_token = None

    while True:
        events_result = service.events().list(
            calendarId="primary",
            maxResults=250,
            singleEvents=False,
            pageToken=page_token,
        ).execute()

        for g_event in events_result.get("items", []):
            obj, created, _ = upsert_google_event(g_event)
            if created:
                created_count += 1

        page_token = events_result.get("nextPageToken")
        if not page_token:
            break

    # Save the sync token
    sync_token = events_result.get("nextSyncToken", "")
    account.google_sync_token = sync_token
    account.save(update_fields=["google_sync_token"])

    return created_count, sync_token


@transaction.atomic
def incremental_sync_google_calendar(account: Account):
    """
    Perform an incremental sync using the stored syncToken.
    Returns (created_count, updated_count, deleted_count)
    """
    service = get_google_service(account)
    if not service:
        raise ValueError("Google service not available for this account")

    if not account.google_sync_token:
        # No sync token - need full sync first
        created, _ = full_sync_google_calendar(account)
        return created, 0, 0

    created_count = 0
    updated_count = 0
    deleted_count = 0
    page_token = None

    try:
        while True:
            request_params = {
                "calendarId": "primary",
                "maxResults": 250,
                "singleEvents": False,
                "showDeleted": True,  # Important: get deleted events
            }

            if page_token:
                request_params["pageToken"] = page_token
            else:
                request_params["syncToken"] = account.google_sync_token

            events_result = service.events().list(**request_params).execute()

            for g_event in events_result.get("items", []):
                obj, created, deleted = upsert_google_event(g_event)

                if deleted:
                    deleted_count += 1
                elif created:
                    created_count += 1
                elif obj:
                    updated_count += 1

            page_token = events_result.get("nextPageToken")
            if not page_token:
                break

        # Save the new sync token
        sync_token = events_result.get("nextSyncToken", "")
        account.google_sync_token = sync_token
        account.save(update_fields=["google_sync_token"])

    except Exception as e:
        error_str = str(e)
        # If sync token is invalid (410 Gone), do a full sync
        if "410" in error_str or "fullSyncRequired" in error_str.lower():
            account.google_sync_token = ""
            account.save(update_fields=["google_sync_token"])
            created, _ = full_sync_google_calendar(account)
            return created, 0, 0
        raise

    return created_count, updated_count, deleted_count


def setup_push_notifications(account: Account):
    """
    Set up push notifications (watch) for an account's calendar.
    Returns the channel info.
    """
    service = get_google_service(account)
    if not service:
        raise ValueError("Google service not available for this account")

    channel_id = str(uuid.uuid4())
    expiration = datetime.now(timezone.utc) + timedelta(days=7)  # Max is ~30 days

    body = {
        "id": channel_id,
        "type": "web_hook",
        "address": f"{settings.FRONTEND_URL}/api/calendar/webhook/google/",
        "token": f"account_id={account.id}",  # Custom token to identify account
        "expiration": int(expiration.timestamp() * 1000),  # Milliseconds
    }

    result = service.events().watch(calendarId="primary", body=body).execute()

    # Save channel info
    account.google_channel_id = channel_id
    account.google_channel_expiration = expiration
    account.save(update_fields=["google_channel_id", "google_channel_expiration"])

    return result


def stop_push_notifications(account: Account):
    """Stop an existing watch channel."""
    service = get_google_service(account)
    if not service or not account.google_channel_id:
        return

    try:
        service.channels().stop(body={
            "id": account.google_channel_id,
            "resourceId": account.google_channel_id,
        }).execute()
    except Exception:
        pass  # Channel may already be expired

    account.google_channel_id = ""
    account.google_channel_expiration = None
    account.save(update_fields=["google_channel_id", "google_channel_expiration"])


def renew_expiring_channels():
    """
    Renew channels that are expiring soon.
    Call this from a daily Celery task.
    """
    threshold = datetime.now(timezone.utc) + timedelta(days=1)
    
    accounts = Account.objects.filter(
        google_id__isnull=False,
        google_channel_expiration__lt=threshold,
    )

    for account in accounts:
        try:
            stop_push_notifications(account)
            setup_push_notifications(account)
        except Exception as e:
            # Log error
            print(f"Failed to renew channel for account {account.id}: {e}")