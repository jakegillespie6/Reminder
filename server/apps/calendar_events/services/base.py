from calendar import monthrange
from datetime import datetime, timedelta, timezone


def _add_month(dt: datetime) -> datetime:
    month = dt.month + 1
    year = dt.year
    if month > 12:
        month = 1
        year += 1
    day = min(dt.day, monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _add_year(dt: datetime) -> datetime:
    year = dt.year + 1
    day = min(dt.day, monthrange(year, dt.month)[1])
    return dt.replace(year=year, day=day)


def _next_dt(dt: datetime, recurrence: str):
    if recurrence == "daily":
        return dt + timedelta(days=1)
    if recurrence == "weekly":
        return dt + timedelta(weeks=1)
    if recurrence == "monthly":
        return _add_month(dt)
    if recurrence == "yearly":
        return _add_year(dt)
    return None


def _to_ts(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return int(dt.timestamp())


def expand_event(event, start_at, end_at, max_instances=2000):
    rows = []

    def make_row(instance_dt: datetime):
        start_ts = _to_ts(instance_dt)
        end_ts = (
            start_ts + event.duration_seconds
            if event.duration_seconds is not None
            else None
        )
        return {
            "event_id": event.id,
            "title": event.title,
            "start_at": instance_dt,
            "start_ts": start_ts,
            "end_ts": end_ts,
            "duration_seconds": event.duration_seconds,
            "complete": event.complete,
            "timing_type": event.timing_type,
            "source": event.source,
            "recurrence": event.recurrence,
            "external_id": event.external_id,
        }

    if event.recurrence == "none":
        if start_at <= event.start_at < end_at:
            rows.append(make_row(event.start_at))
        return rows

    cursor = event.start_at
    count = 0
    while cursor < end_at and count < max_instances:
        if event.recurrence_end and cursor.date() > event.recurrence_end:
            break

        if cursor >= start_at:
            rows.append(make_row(cursor))

        nxt = _next_dt(cursor, event.recurrence)
        if not nxt:
            break
        cursor = nxt
        count += 1

    return rows


def list_events_in_range(queryset, start_at, end_at, expand_recurrence=True):
    if not expand_recurrence:
        return list(queryset.order_by("start_at"))

    result = []
    for event in queryset:
        result.extend(expand_event(event, start_at, end_at))

    result.sort(key=lambda x: x["start_ts"])
    return result