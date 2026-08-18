from rest_framework import serializers
from .models import GlobalSetting
from .services.definitions import (
    SUPPORTED_SETTINGS,
    validate_setting_value,
    UnsupportedSettingError,
    InvalidSettingValueError,
)


class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = ("key", "value", "updated_at")
        read_only_fields = ("key", "updated_at")


class GlobalSettingUpdateSerializer(serializers.Serializer):
    value = serializers.JSONField()

    def validate(self, attrs):
        key = self.context.get("key")
        if key not in SUPPORTED_SETTINGS:
            raise serializers.ValidationError({"key": f"Unsupported setting key: {key}"})
        try:
            attrs["value"] = validate_setting_value(key, attrs["value"])
        except (UnsupportedSettingError, InvalidSettingValueError) as exc:
            raise serializers.ValidationError({"value": str(exc)}) from exc
        return attrs