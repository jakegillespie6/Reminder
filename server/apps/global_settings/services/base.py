from typing import Any
from django.db import transaction
from ..models import GlobalSetting
from .definitions import (
    SETTING_DEFINITIONS,
    UnsupportedSettingError,
    validate_setting_value,
)
from common.events.services import broker


def get_setting(key: str) -> GlobalSetting:
    spec = SETTING_DEFINITIONS.get(key)
    if not spec:
        raise UnsupportedSettingError(f"Unsupported setting key: '{key}'.")

    obj, _ = GlobalSetting.objects.get_or_create(
        key=key,
        defaults={"value": spec.default},
    )
    return obj


def _publish_setting_changed(key: str, value: Any, previous_value: Any, updated_at: str | None):
    broker.publish(
        topic="global_settings",
        event_name="setting.changed",
        payload={
            "key": key,
            "value": value,
            "previous_value": previous_value,
            "updated_at": updated_at,
        },
    )


def set_setting(key: str, value: Any) -> GlobalSetting:
    validated = validate_setting_value(key, value)
    obj = get_setting(key)

    previous = obj.value
    if previous == validated:
        return obj

    obj.value = validated
    obj.save(update_fields=["value", "updated_at"])

    transaction.on_commit(
        lambda: _publish_setting_changed(
            key=key,
            value=obj.value,
            previous_value=previous,
            updated_at=obj.updated_at.isoformat() if obj.updated_at else None,
        )
    )

    return obj