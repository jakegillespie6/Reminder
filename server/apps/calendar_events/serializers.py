from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from .models import CalendarEvent


VALID_WEEKDAYS = {
    "MO",
    "TU",
    "WE",
    "TH",
    "FR",
    "SA",
    "SU",
}


class CalendarEventSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()
    is_multi_day = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent

        fields = [
            "id",
            "title",

            "start_date",
            "end_date",
            "timing_type",

            "duration_seconds",
            "is_multi_day",

            "complete",

            "recurrence",
            "recurrence_interval",
            "recurrence_end",
            "recurrence_count",
            "recurrence_days_of_week",
            "recurrence_days_of_month",
            "recurrence_months_of_year",
            "recurrence_set_positions",

            "timezone",

            "source",
            "external_id",
            "external_local_id",
            "external_calendar_id",
        ]

        read_only_fields = [
            "id",
            "duration_seconds",
            "is_multi_day",

            # Normal app endpoints should not let clients pretend that
            # an internal event belongs to Apple/Google.
            "source",
            "external_id",
            "external_local_id",
            "external_calendar_id",
        ]

    def get_duration_seconds(self, obj) -> int:
        return obj.duration_seconds

    def get_is_multi_day(self, obj) -> bool:
        if not obj.start_date or not obj.end_date:
            return False

        event_timezone = ZoneInfo(obj.timezone)
        start = obj.start_date.astimezone(event_timezone)
        end = obj.end_date.astimezone(event_timezone)

        return start.date() != end.date()

    def validate_timezone(self, value):
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise serializers.ValidationError(
                "Invalid IANA timezone."
            ) from exc

        return value

    def validate_recurrence_days_of_week(self, value):
        invalid = set(value) - VALID_WEEKDAYS

        if invalid:
            raise serializers.ValidationError(
                f"Invalid weekday values: {sorted(invalid)}"
            )

        return value

    def validate_recurrence_days_of_month(self, value):
        for day in value:
            if not isinstance(day, int):
                raise serializers.ValidationError(
                    "All values must be integers."
                )

            if day == 0 or day < -31 or day > 31:
                raise serializers.ValidationError(
                    "Values must be between -31 and 31 and cannot be 0."
                )

        return value

    def validate_recurrence_months_of_year(self, value):
        for month in value:
            if (
                not isinstance(month, int)
                or month < 1
                or month > 12
            ):
                raise serializers.ValidationError(
                    "Month values must be between 1 and 12."
                )

        return value

    def validate_recurrence_set_positions(self, value):
        for position in value:
            if not isinstance(position, int):
                raise serializers.ValidationError(
                    "All values must be integers."
                )

            if position == 0:
                raise serializers.ValidationError(
                    "Recurrence positions cannot be 0."
                )

        return value

    def validate(self, attrs):
        instance = self.instance

        start_date = attrs.get(
            "start_date",
            getattr(instance, "start_date", None)
            if instance
            else None,
        )

        end_date = attrs.get(
            "end_date",
            getattr(instance, "end_date", None)
            if instance
            else None,
        )

        timing_type = attrs.get(
            "timing_type",
            getattr(
                instance,
                "timing_type",
                CalendarEvent.TimingType.EXACT,
            )
            if instance
            else CalendarEvent.TimingType.EXACT,
        )

        recurrence = attrs.get(
            "recurrence",
            getattr(
                instance,
                "recurrence",
                CalendarEvent.Recurrence.NONE,
            )
            if instance
            else CalendarEvent.Recurrence.NONE,
        )

        recurrence_interval = attrs.get(
            "recurrence_interval",
            getattr(instance, "recurrence_interval", 1)
            if instance
            else 1,
        )

        recurrence_end = attrs.get(
            "recurrence_end",
            getattr(instance, "recurrence_end", None)
            if instance
            else None,
        )

        recurrence_count = attrs.get(
            "recurrence_count",
            getattr(instance, "recurrence_count", None)
            if instance
            else None,
        )

        timezone_name = attrs.get(
            "timezone",
            getattr(
                instance,
                "timezone",
                "America/Los_Angeles",
            )
            if instance
            else "America/Los_Angeles",
        )

        if not self.partial:
            if start_date is None:
                raise serializers.ValidationError({
                    "start_date": "This field is required."
                })

            if end_date is None:
                raise serializers.ValidationError({
                    "end_date": "This field is required."
                })

        if (
            start_date is not None
            and end_date is not None
            and end_date < start_date
        ):
            raise serializers.ValidationError({
                "end_date":
                    "Must be after or equal to start_date."
            })

        if recurrence_interval < 1:
            raise serializers.ValidationError({
                "recurrence_interval":
                    "Must be greater than 0."
            })

        if (
            recurrence_count is not None
            and recurrence_count < 1
        ):
            raise serializers.ValidationError({
                "recurrence_count":
                    "Must be greater than 0."
            })

        if recurrence_end and recurrence_count:
            raise serializers.ValidationError({
                "recurrence_end":
                    "Specify recurrence_end or recurrence_count, "
                    "not both."
            })

        if (
            recurrence != CalendarEvent.Recurrence.NONE
            and recurrence_end
            and start_date
        ):
            event_timezone = ZoneInfo(timezone_name)

            local_start = start_date.astimezone(
                event_timezone
            )

            if recurrence_end < local_start.date():
                raise serializers.ValidationError({
                    "recurrence_end":
                        "Must be on or after start_date."
                })

        # If recurrence is removed, clear all recurrence-specific
        # configuration.
        if recurrence == CalendarEvent.Recurrence.NONE:
            attrs["recurrence_interval"] = 1
            attrs["recurrence_end"] = None
            attrs["recurrence_count"] = None
            attrs["recurrence_days_of_week"] = []
            attrs["recurrence_days_of_month"] = []
            attrs["recurrence_months_of_year"] = []
            attrs["recurrence_set_positions"] = []

        # All-day events use inclusive day boundaries:
        # start = Sep 12 00:00:00
        # end   = Sep 12 23:59:59
        if timing_type == CalendarEvent.TimingType.ALL_DAY:
            event_timezone = ZoneInfo(timezone_name)

            timing_type_changed = (
                "timing_type" in attrs
                and attrs["timing_type"]
                == CalendarEvent.TimingType.ALL_DAY
            )

            if ("start_date" in attrs or timing_type_changed) and start_date:
                local_start = start_date.astimezone(event_timezone)

                attrs["start_date"] = datetime(
                    year=local_start.year,
                    month=local_start.month,
                    day=local_start.day,
                    tzinfo=event_timezone,
                )

            if ("end_date" in attrs or timing_type_changed) and end_date:
                local_end = end_date.astimezone(event_timezone)

                attrs["end_date"] = datetime(
                    year=local_end.year,
                    month=local_end.month,
                    day=local_end.day,
                    hour=23,
                    minute=59,
                    second=59,
                    tzinfo=event_timezone,
                )

        return attrs


class CalendarEventQuerySerializer(serializers.Serializer):
    """
    Query params for listing calendar events.
    """

    start_date = serializers.DateTimeField(
        required=False,
    )

    end_date = serializers.DateTimeField(
        required=False,
    )

    expand_recurrence = serializers.BooleanField(
        default=True,
    )

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if (
            (start_date is None)
            != (end_date is None)
        ):
            raise serializers.ValidationError(
                "Both start_date and end_date are required "
                "for date range filtering."
            )

        if (
            start_date
            and end_date
            and end_date <= start_date
        ):
            raise serializers.ValidationError(
                "end_date must be after start_date."
            )

        return attrs


class EventOccurrenceSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()

    # Original recurrence-generated start.
    #
    # This remains unchanged if the actual occurrence is moved.
    occurrence_date = serializers.DateTimeField()

    title = serializers.CharField()

    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()

    duration_seconds = serializers.IntegerField()
    is_multi_day = serializers.BooleanField()

    complete = serializers.BooleanField()

    timing_type = serializers.CharField()
    recurrence = serializers.CharField()

    is_exception = serializers.BooleanField()


class CalendarEventOccurrenceUpdateSerializer(
    serializers.Serializer
):
    """
    Modify one occurrence of a recurring series.
    """

    occurrence_date = serializers.DateTimeField()

    title = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=64,
    )

    start_date = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    end_date = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    complete = serializers.BooleanField(
        required=False,
        allow_null=True,
    )

    timing_type = serializers.ChoiceField(
        choices=CalendarEvent.TimingType.choices,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if (
            start_date is not None
            and end_date is not None
            and end_date < start_date
        ):
            raise serializers.ValidationError({
                "end_date":
                    "Must be after or equal to start_date."
            })

        return attrs


class CalendarEventOccurrenceDeleteSerializer(
    serializers.Serializer
):
    occurrence_date = serializers.DateTimeField()