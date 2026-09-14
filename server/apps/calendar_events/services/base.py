from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo


from dateutil.rrule import (
    DAILY,
    WEEKLY,
    MONTHLY,
    YEARLY,
    MO,
    TU,
    WE,
    TH,
    FR,
    SA,
    SU,
    rrule,
)

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)

from ..models import CalendarEvent, CalendarEventException

from .events import (
    publish_event_created,
    publish_event_updated,
    publish_event_deleted,
    publish_occurrence_updated,
    publish_occurrence_deleted,
)


FREQUENCIES = {
    CalendarEvent.Recurrence.DAILY: DAILY,
    CalendarEvent.Recurrence.WEEKLY: WEEKLY,
    CalendarEvent.Recurrence.MONTHLY: MONTHLY,
    CalendarEvent.Recurrence.YEARLY: YEARLY,
}

WEEKDAYS = {
    "MO": MO,
    "TU": TU,
    "WE": WE,
    "TH": TH,
    "FR": FR,
    "SA": SA,
    "SU": SU,
}


def _to_ts(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)

    return int(dt.timestamp())


def _occurrence_key(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc)


def create_event(data: dict) -> CalendarEvent:
    with transaction.atomic():
        event = CalendarEvent.objects.create(**data)

        transaction.on_commit(
            lambda event=event: publish_event_created(event)
        )

    return event


def _ensure_event_editable(event: CalendarEvent) -> None:
    if event.source == CalendarEvent.Source.APPLE:
        raise PermissionDenied(
            "Apple Calendar events cannot be edited."
        )


def update_event(event_id: int, data: dict) -> CalendarEvent:
    with transaction.atomic():
        event = get_object_or_404(
            CalendarEvent,
            id=event_id,
        )

        _ensure_event_editable(event)

        for key, value in data.items():
            setattr(event, key, value)

        event.save()

        transaction.on_commit(
            lambda event=event: publish_event_updated(event)
        )

    return event


def delete_event(event_id: int) -> None:
    with transaction.atomic():
        event = get_object_or_404(
            CalendarEvent,
            id=event_id,
        )

        _ensure_event_editable(event)

        deleted_id = event.id
        event.delete()

        transaction.on_commit(
            lambda event_id=deleted_id:
            publish_event_deleted(event_id)
        )


def _build_recurrence_rule(event: CalendarEvent):
    if event.recurrence == CalendarEvent.Recurrence.NONE:
        return None

    frequency = FREQUENCIES.get(event.recurrence)

    if frequency is None:
        return None

    event_timezone = ZoneInfo(event.timezone)
    dtstart = event.start_date.astimezone(event_timezone)

    kwargs = {
        "freq": frequency,
        "dtstart": dtstart,
        "interval": event.recurrence_interval,
    }

    if event.recurrence_count:
        kwargs["count"] = event.recurrence_count

    if event.recurrence_days_of_week:
        kwargs["byweekday"] = [
            WEEKDAYS[value]
            for value in event.recurrence_days_of_week
        ]

    if event.recurrence_days_of_month:
        kwargs["bymonthday"] = event.recurrence_days_of_month

    if event.recurrence_months_of_year:
        kwargs["bymonth"] = event.recurrence_months_of_year

    if event.recurrence_set_positions:
        kwargs["bysetpos"] = event.recurrence_set_positions

    return rrule(**kwargs)


def _effective_recurrence_end(
    event: CalendarEvent,
    window_end: datetime,
):
    event_timezone = ZoneInfo(event.timezone)
    local_window_end = window_end.astimezone(event_timezone)

    if not event.recurrence_end:
        return local_window_end

    day_after = event.recurrence_end + timedelta(days=1)

    recurrence_boundary = datetime(
        year=day_after.year,
        month=day_after.month,
        day=day_after.day,
        tzinfo=event_timezone,
    )

    return min(local_window_end, recurrence_boundary)


def _iter_occurrence_starts(
    event: CalendarEvent,
    window_start: datetime,
    window_end: datetime,
    max_instances: int = 2000,
):
    rule = _build_recurrence_rule(event)

    if rule is None:
        return

    event_timezone = ZoneInfo(event.timezone)
    event_duration = event.end_date - event.start_date
    local_window_start = window_start.astimezone(event_timezone)
    effective_end = _effective_recurrence_end(event, window_end)

    search_start = local_window_start - event_duration
    count = 0

    for occurrence_start in rule.xafter(
        search_start,
        count=max_instances + 1,
        inc=True,
    ):
        if occurrence_start >= effective_end:
            break

        if (
            event.recurrence_end
            and occurrence_start.date() > event.recurrence_end
        ):
            break

        if count >= max_instances:
            break

        count += 1
        yield occurrence_start


def _is_multi_day(
    event: CalendarEvent,
    start_date: datetime,
    end_date: datetime,
) -> bool:
    event_timezone = ZoneInfo(event.timezone)
    local_start = start_date.astimezone(event_timezone)
    local_end = end_date.astimezone(event_timezone)

    return local_start.date() != local_end.date()


def _make_row(
    *,
    event: CalendarEvent,
    occurrence_date: datetime,
    start_date: datetime,
    end_date: datetime,
    title=None,
    complete=None,
    timing_type=None,
    is_exception=False,
):
    return {
        "event_id": event.id,
        "occurrence_date": occurrence_date,
        "title": event.title if title is None else title,
        "start_date": start_date,
        "end_date": end_date,
        "start_ts": _to_ts(start_date),
        "end_ts": _to_ts(end_date),
        "duration_seconds": int(
            (end_date - start_date).total_seconds()
        ),
        "is_multi_day": _is_multi_day(
            event,
            start_date,
            end_date,
        ),
        "complete": event.complete if complete is None else complete,
        "timing_type": (
            event.timing_type
            if timing_type is None
            else timing_type
        ),
        "recurrence": event.recurrence,
        "is_exception": is_exception,
    }


def _resolve_exception_dates(
    event: CalendarEvent,
    exception: CalendarEventException,
):
    event_duration = event.end_date - event.start_date
    occurrence_start = exception.original_start_date

    actual_start = (
        exception.start_date
        if exception.start_date
        else occurrence_start
    )

    if exception.end_date:
        actual_end = exception.end_date
    elif exception.start_date:
        actual_end = actual_start + event_duration
    else:
        actual_end = occurrence_start + event_duration

    return actual_start, actual_end


def _row_from_exception(
    event: CalendarEvent,
    exception: CalendarEventException,
):
    actual_start, actual_end = _resolve_exception_dates(
        event,
        exception,
    )

    return _make_row(
        event=event,
        occurrence_date=exception.original_start_date,
        start_date=actual_start,
        end_date=actual_end,
        title=exception.title,
        complete=exception.complete,
        timing_type=exception.timing_type,
        is_exception=True,
    )


def _overlaps_window(
    start_date: datetime,
    end_date: datetime,
    window_start: datetime,
    window_end: datetime,
):
    return (
        start_date < window_end
        and end_date > window_start
    )


def expand_event(
    event: CalendarEvent,
    window_start: datetime,
    window_end: datetime,
    max_instances: int = 2000,
):
    rows = []

    if event.recurrence == CalendarEvent.Recurrence.NONE:
        if _overlaps_window(
            event.start_date,
            event.end_date,
            window_start,
            window_end,
        ):
            rows.append(
                _make_row(
                    event=event,
                    occurrence_date=event.start_date,
                    start_date=event.start_date,
                    end_date=event.end_date,
                )
            )

        return rows

    exceptions = list(event.exceptions.all())

    exception_map = {
        _occurrence_key(exception.original_start_date): exception
        for exception in exceptions
    }

    processed_exception_keys = set()
    event_duration = event.end_date - event.start_date

    for occurrence_start in _iter_occurrence_starts(
        event,
        window_start,
        window_end,
        max_instances=max_instances,
    ):
        occurrence_end = occurrence_start + event_duration
        key = _occurrence_key(occurrence_start)
        exception = exception_map.get(key)

        if exception:
            processed_exception_keys.add(key)

            if exception.cancelled:
                continue

            row = _row_from_exception(event, exception)

            if _overlaps_window(
                row["start_date"],
                row["end_date"],
                window_start,
                window_end,
            ):
                rows.append(row)

            continue

        if _overlaps_window(
            occurrence_start,
            occurrence_end,
            window_start,
            window_end,
        ):
            rows.append(
                _make_row(
                    event=event,
                    occurrence_date=occurrence_start,
                    start_date=occurrence_start,
                    end_date=occurrence_end,
                )
            )

    for exception in exceptions:
        key = _occurrence_key(exception.original_start_date)

        if key in processed_exception_keys:
            continue

        if exception.cancelled:
            continue

        row = _row_from_exception(event, exception)

        if _overlaps_window(
            row["start_date"],
            row["end_date"],
            window_start,
            window_end,
        ):
            rows.append(row)

    return rows


def list_events_in_range(
    queryset,
    start_date: datetime,
    end_date: datetime,
    expand_recurrence: bool = True,
):
    if not expand_recurrence:
        return list(queryset.order_by("start_date"))

    result = []

    for event in queryset:
        result.extend(
            expand_event(
                event,
                start_date,
                end_date,
            )
        )

    result.sort(key=lambda row: row["start_ts"])
    return result


def _validate_occurrence_exists(
    event: CalendarEvent,
    occurrence_date: datetime,
):
    if event.recurrence == CalendarEvent.Recurrence.NONE:
        raise ValidationError(
            "Occurrence operations are only valid for recurring events."
        )

    event_timezone = ZoneInfo(event.timezone)
    requested = occurrence_date.astimezone(event_timezone)

    if (
        event.recurrence_end
        and requested.date() > event.recurrence_end
    ):
        raise ValidationError(
            "The requested occurrence is outside the recurrence range."
        )

    rule = _build_recurrence_rule(event)
    candidate = rule.before(requested, inc=True)

    if (
        candidate is None
        or _occurrence_key(candidate) != _occurrence_key(requested)
    ):
        raise ValidationError(
            "The supplied occurrence_date does not belong "
            "to this recurring event."
        )


def update_event_occurrence(
    event_id: int,
    data: dict,
):
    with transaction.atomic():
        event = get_object_or_404(
            CalendarEvent,
            id=event_id,
        )

        _ensure_event_editable(event)

        occurrence_date = data["occurrence_date"]

        _validate_occurrence_exists(
            event,
            occurrence_date,
        )

        exception, _ = (
            CalendarEventException.objects.get_or_create(
                event=event,
                original_start_date=occurrence_date,
            )
        )

        for field in [
            "title",
            "start_date",
            "end_date",
            "complete",
            "timing_type",
        ]:
            if field in data:
                setattr(exception, field, data[field])

        exception.cancelled = False

        actual_start, actual_end = _resolve_exception_dates(
            event,
            exception,
        )

        if actual_end < actual_start:
            raise ValidationError({
                "end_date": "Must be after or equal to start_date."
            })

        exception.save()

        transaction.on_commit(
            lambda event_id=event.id,
            occurrence_date=exception.original_start_date:
            publish_occurrence_updated(
                event_id,
                occurrence_date,
            )
        )

        row = _row_from_exception(event, exception)

    return row


def delete_event_occurrence(
    event_id: int,
    occurrence_date: datetime,
):
    with transaction.atomic():
        event = get_object_or_404(
            CalendarEvent,
            id=event_id,
        )

        _ensure_event_editable(event)

        _validate_occurrence_exists(
            event,
            occurrence_date,
        )

        exception, _ = (
            CalendarEventException.objects.get_or_create(
                event=event,
                original_start_date=occurrence_date,
            )
        )

        exception.cancelled = True
        exception.save(update_fields=["cancelled"])

        transaction.on_commit(
            lambda event_id=event.id,
            occurrence_date=occurrence_date:
            publish_occurrence_deleted(
                event_id,
                occurrence_date,
            )
        )