from django.db import models
from django.db.models import Q


class CalendarEventQuerySet(models.QuerySet):
    def within_window(self, start_date, end_date):
        """
        Return events/series that could produce an occurrence inside the
        requested window.

        Recurring events are expanded later in the service layer.
        """

        one_time = Q(
            recurrence=CalendarEvent.Recurrence.NONE,
            start_date__lt=end_date,
            end_date__gt=start_date,
        )

        recurring = (
            ~Q(recurrence=CalendarEvent.Recurrence.NONE)
            & Q(start_date__lt=end_date)
            & (
                Q(recurrence_end__isnull=True)
                | Q(recurrence_end__gte=start_date.date())
            )
        )

        # Handles detached occurrences that have been moved into the
        # requested window even if their original occurrence was outside it.
        moved_exception = (
            Q(exceptions__cancelled=False)
            & Q(exceptions__start_date__lt=end_date)
            & (
                Q(exceptions__end_date__gt=start_date)
                | Q(exceptions__end_date__isnull=True)
            )
        )

        return self.filter(
            one_time | recurring | moved_exception
        ).distinct()


class CalendarEventManager(
    models.Manager.from_queryset(CalendarEventQuerySet)
):
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
        APPLE = "apple", "Apple"

    class TimingType(models.TextChoices):
        EXACT = "exact", "Exact time"
        ALL_DAY = "all_day", "All day"

    title = models.CharField(
        max_length=64,
    )

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    timing_type = models.CharField(
        max_length=16,
        choices=TimingType.choices,
        default=TimingType.EXACT,
    )

    complete = models.BooleanField(
        default=False,
    )

    # ============================================================
    # Recurrence
    # ============================================================

    recurrence = models.CharField(
        max_length=16,
        choices=Recurrence.choices,
        default=Recurrence.NONE,
    )

    # Examples:
    #
    # recurrence=weekly, interval=1
    # -> every week
    #
    # recurrence=weekly, interval=2
    # -> every other week
    recurrence_interval = models.PositiveIntegerField(
        default=1,
    )

    # End recurrence on this calendar date.
    recurrence_end = models.DateField(
        null=True,
        blank=True,
    )

    # Alternative to recurrence_end:
    # stop after N total occurrences.
    recurrence_count = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # RFC-style weekday values:
    #
    # ["MO", "WE", "FR"]
    recurrence_days_of_week = models.JSONField(
        default=list,
        blank=True,
    )

    # Examples:
    #
    # [1]       -> first of month
    # [1, 15]   -> first and fifteenth
    # [-1]      -> last day
    recurrence_days_of_month = models.JSONField(
        default=list,
        blank=True,
    )

    # 1-12
    recurrence_months_of_year = models.JSONField(
        default=list,
        blank=True,
    )

    # Used for rules such as:
    #
    # third Monday:
    # days_of_week=["MO"]
    # set_positions=[3]
    #
    # last Friday:
    # days_of_week=["FR"]
    # set_positions=[-1]
    recurrence_set_positions = models.JSONField(
        default=list,
        blank=True,
    )

    # Recurrence should be evaluated in this timezone rather than UTC.
    #
    # This is important for DST. For example, an event recurring at
    # 8:00 AM Pacific should remain at 8:00 AM when DST changes.
    timezone = models.CharField(
        max_length=64,
        default="America/Los_Angeles",
    )

    # ============================================================
    # External calendar synchronization
    # ============================================================

    source = models.CharField(
        max_length=16,
        choices=Source.choices,
        default=Source.INTERNAL,
    )

    # Apple's calendarItemExternalIdentifier / corresponding
    # external identifier for other providers.
    external_id = models.CharField(
        max_length=255,
        blank=True,
    )

    # Provider-local ID.
    #
    # For Apple this could represent calendarItemIdentifier.
    external_local_id = models.CharField(
        max_length=255,
        blank=True,
    )

    # External calendar/container identifier.
    external_calendar_id = models.CharField(
        max_length=255,
        blank=True,
    )

    objects = CalendarEventManager()

    @property
    def duration_seconds(self) -> int:
        return int(
            (self.end_date - self.start_date).total_seconds()
        )

    @property
    def is_multi_day(self) -> bool:
        return (
            self.start_date.date()
            != self.end_date.date()
        )

    class Meta:
        ordering = ["start_date"]

        db_table = "calendar_events"

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "source",
                    "external_calendar_id",
                    "external_id",
                ],
                name="uniq_calendar_event_external",
                condition=~Q(external_id=""),
            ),
            models.CheckConstraint(
                condition=Q(
                    end_date__gte=models.F("start_date")
                ),
                name="end_date_gte_start_date",
            ),
        ]


class CalendarEventException(models.Model):
    """
    Represents an override/detached occurrence of a recurring event.

    The recurring occurrence itself is not stored in the database.

    Example:

        CalendarEvent:
            every Tuesday at 6 PM

        Exception:
            original_start_date = Sept 15 at 6 PM
            start_date = Sept 15 at 8 PM

    original_start_date is equivalent in concept to Apple's
    EKEvent.occurrenceDate.
    """

    event = models.ForeignKey(
        CalendarEvent,
        related_name="exceptions",
        on_delete=models.CASCADE,
    )

    # Identifies the original generated occurrence.
    #
    # This NEVER changes just because the occurrence was moved.
    original_start_date = models.DateTimeField()

    # Overrides.
    #
    # Null means inherit from the recurring series.
    start_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    end_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    title = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    complete = models.BooleanField(
        null=True,
        blank=True,
    )

    timing_type = models.CharField(
        max_length=16,
        choices=CalendarEvent.TimingType.choices,
        null=True,
        blank=True,
    )

    # A deleted occurrence is represented as a cancelled exception.
    cancelled = models.BooleanField(
        default=False,
    )

    # Optional metadata for detached external-calendar instances.
    external_id = models.CharField(
        max_length=255,
        blank=True,
    )

    external_local_id = models.CharField(
        max_length=255,
        blank=True,
    )

    class Meta:
        ordering = ["original_start_date"]

        db_table = "calendar_event_exceptions"

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "event",
                    "original_start_date",
                ],
                name="uniq_calendar_event_exception",
            ),
        ]