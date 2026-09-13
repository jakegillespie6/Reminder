from common.events.services import broker

from ..models import CalendarEvent


def event_payload(event: CalendarEvent) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "start_date": (
            event.start_date.isoformat()
            if event.start_date
            else None
        ),
        "end_date": (
            event.end_date.isoformat()
            if event.end_date
            else None
        ),
        "timing_type": event.timing_type,
        "complete": event.complete,
        "recurrence": event.recurrence,
        "recurrence_interval": event.recurrence_interval,
        "recurrence_end": (
            event.recurrence_end.isoformat()
            if event.recurrence_end
            else None
        ),
        "recurrence_count": event.recurrence_count,
        "recurrence_days_of_week": (
            event.recurrence_days_of_week
        ),
        "recurrence_days_of_month": (
            event.recurrence_days_of_month
        ),
        "recurrence_months_of_year": (
            event.recurrence_months_of_year
        ),
        "recurrence_set_positions": (
            event.recurrence_set_positions
        ),
        "timezone": event.timezone,
        "source": event.source,
    }


def occurrence_payload(
    event_id: int,
    occurrence_date,
) -> dict:
    return {
        "event_id": event_id,
        "occurrence_date": occurrence_date.isoformat(),
    }


def publish_event_created(event: CalendarEvent) -> None:
    broker.publish(
        topic="calendar_events",
        event_name="calendar_event.created",
        payload=event_payload(event),
    )


def publish_event_updated(event: CalendarEvent) -> None:
    broker.publish(
        topic="calendar_events",
        event_name="calendar_event.updated",
        payload=event_payload(event),
    )


def publish_event_deleted(event_id: int) -> None:
    broker.publish(
        topic="calendar_events",
        event_name="calendar_event.deleted",
        payload={"id": event_id},
    )


def publish_occurrence_updated(
    event_id: int,
    occurrence_date,
) -> None:
    broker.publish(
        topic="calendar_events",
        event_name="calendar_event.occurrence_updated",
        payload=occurrence_payload(
            event_id,
            occurrence_date,
        ),
    )


def publish_occurrence_deleted(
    event_id: int,
    occurrence_date,
) -> None:
    broker.publish(
        topic="calendar_events",
        event_name="calendar_event.occurrence_deleted",
        payload=occurrence_payload(
            event_id,
            occurrence_date,
        ),
    )