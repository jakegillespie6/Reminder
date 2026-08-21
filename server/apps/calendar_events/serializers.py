from datetime import datetime, timezone
from rest_framework import serializers
from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    start_ts = serializers.IntegerField(write_only=True, required=False)
    start_ts_value = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "title",
            "start_at",
            "start_ts",
            "start_ts_value",
            "timing_type",
            "duration_seconds",
            "complete",
            "recurrence",
            "recurrence_end",
            "source",
            "external_id",
        ]
        read_only_fields = ["id", "start_ts_value"]

    def get_start_ts_value(self, obj):
        dt = obj.start_at
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return int(dt.timestamp())

    def validate(self, attrs):
        start_ts = attrs.pop("start_ts", None)

        if start_ts is not None:
            attrs["start_at"] = datetime.fromtimestamp(start_ts, tz=timezone.utc)

        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        timing_type = attrs.get("timing_type", getattr(self.instance, "timing_type", "exact"))
        recurrence = attrs.get("recurrence", getattr(self.instance, "recurrence", "none"))
        recurrence_end = attrs.get("recurrence_end", getattr(self.instance, "recurrence_end", None))
        duration_seconds = attrs.get("duration_seconds", getattr(self.instance, "duration_seconds", None))
        source = attrs.get("source", getattr(self.instance, "source", "internal"))
        external_id = attrs.get("external_id", getattr(self.instance, "external_id", ""))

        if start_at is None:
            raise serializers.ValidationError("start_at or start_ts is required.")

        if timing_type == CalendarEvent.TimingType.ANYTIME:
            if start_at.tzinfo is None:
                start_at = start_at.replace(tzinfo=timezone.utc)
            else:
                start_at = start_at.astimezone(timezone.utc)
            attrs["start_at"] = start_at.replace(hour=0, minute=0, second=0, microsecond=0)

        if duration_seconds is not None and duration_seconds <= 0:
            raise serializers.ValidationError("duration_seconds must be > 0.")

        if recurrence != "none" and recurrence_end and recurrence_end < attrs["start_at"].date():
            raise serializers.ValidationError("recurrence_end must be >= start_at date.")

        if source == "google" and not external_id:
            raise serializers.ValidationError("external_id is required for Google events.")

        return attrs


class EventRangeQuerySerializer(serializers.Serializer):
    start_ts = serializers.IntegerField()
    end_ts = serializers.IntegerField()
    expand_recurrence = serializers.BooleanField(default=True)

    def validate(self, attrs):
        if attrs["end_ts"] <= attrs["start_ts"]:
            raise serializers.ValidationError("end_ts must be after start_ts.")
        return attrs

    @property
    def start_at(self):
        return datetime.fromtimestamp(self.validated_data["start_ts"], tz=timezone.utc)

    @property
    def end_at(self):
        return datetime.fromtimestamp(self.validated_data["end_ts"], tz=timezone.utc)


class EventOccurrenceSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()
    title = serializers.CharField()
    start_at = serializers.DateTimeField()
    start_ts = serializers.IntegerField()
    end_ts = serializers.IntegerField(allow_null=True)
    duration_seconds = serializers.IntegerField(allow_null=True)
    complete = serializers.BooleanField()
    timing_type = serializers.CharField()
    source = serializers.CharField()
    recurrence = serializers.CharField()
    external_id = serializers.CharField(allow_blank=True)