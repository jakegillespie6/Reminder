from django.db import models
from django.db.models import Q


class CalendarEventQuerySet(models.QuerySet):
    def within_window(self, start_at, end_at):
        # Date-window logic (inclusive start, exclusive end)
        one_time = Q(recurrence="none", start_at__gte=start_at, start_at__lt=end_at)
        recurring = (
            ~Q(recurrence="none")
            & Q(start_at__lt=end_at)
            & (Q(recurrence_end__isnull=True) | Q(recurrence_end__gte=start_at.date()))
        )
        return self.filter(one_time | recurring)


class CalendarEventManager(models.Manager.from_queryset(CalendarEventQuerySet)):
    pass


class CalendarEvent(models.Model):
    class Recurrence(models.TextChoices):
        NONE = "none", "None"
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    class Source(models.TextChoices):
        INTERNAL = "internal", "Internal"
        GOOGLE = "google", "Google"

    class TimingType(models.TextChoices):
        EXACT = "exact", "Exact time"
        ANYTIME = "anytime", "Any time that day"

    title = models.CharField(max_length=64)

    # Required
    start_at = models.DateTimeField()

    # Meaning of time in start_at
    timing_type = models.CharField(
        max_length=16,
        choices=TimingType.choices,
        default=TimingType.EXACT,
    )

    # Optional
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    complete = models.BooleanField(default=False)

    recurrence = models.CharField(
        max_length=16,
        choices=Recurrence.choices,
        default=Recurrence.NONE,
    )
    recurrence_end = models.DateField(null=True, blank=True)

    source = models.CharField(
        max_length=16,
        choices=Source.choices,
        default=Source.INTERNAL,
    )
    external_id = models.CharField(max_length=255, blank=True)

    objects = CalendarEventManager()

    class Meta:
        ordering = ["start_at"]
        db_table = "calendar_events"

        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"],
                name="uniq_calendar_event_source_external_id",
                condition=~Q(external_id=""),
            )
        ]