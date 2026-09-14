from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable

from apps.items.models import ITEM_QUERY_FILTERS, Item
from ..models import CalendarChoices, ThemeChoices

class UnsupportedSettingError(Exception):
    pass


class InvalidSettingValueError(Exception):
    pass


Validator = Callable[[Any], Any]

CALENDAR_VIEW_VALUES = set(CalendarChoices.values)
THEME_VALUES = set(ThemeChoices.values)


@dataclass(frozen=True)
class SettingSpec:
    default: Any
    validator: Validator


def _validate_calendar_filters(value: Any) -> dict[str, Any]:
    if value is None or value == {}:
        return {"view": CalendarChoices.WEEKLY.value}

    if not isinstance(value, dict):
        raise InvalidSettingValueError("'calendar_filters' must be an object.")

    result: dict[str, Any] = {}

    start_str = value.get("start_date") or value.get("start_at")
    end_str = value.get("end_date") or value.get("end_at")

    if start_str and end_str:
        try:
            start_date = datetime.fromisoformat(str(start_str).replace("Z", "+00:00"))
            end_date = datetime.fromisoformat(str(end_str).replace("Z", "+00:00"))
        except (ValueError, TypeError, AttributeError) as exc:
            raise InvalidSettingValueError(
                "Start and end dates must be valid ISO 8601 datetime strings."
            ) from exc

        if end_date <= start_date:
            raise InvalidSettingValueError("End date must be after start date.")

        result["start_date"] = start_date.isoformat()
        result["end_date"] = end_date.isoformat()
    elif start_str or end_str:
        raise InvalidSettingValueError(
            "'calendar_filters' requires both start and end date when filtering by date."
        )

    view_val = value.get("view", CalendarChoices.WEEKLY.value)
    if view_val not in CALENDAR_VIEW_VALUES:
        raise InvalidSettingValueError(
            f"'view' must be one of: {', '.join(sorted(CALENDAR_VIEW_VALUES))}."
        )
    result["view"] = view_val

    return result


def _validate_choice(key: str, value: Any, allowed: set[str]) -> str:
    if not isinstance(value, str) or value not in allowed:
        raise InvalidSettingValueError(f"'{key}' must be one of: {', '.join(sorted(allowed))}.")
    return value


def _validate_item_filters(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise InvalidSettingValueError("'item_filters' must be an object/map.")

    # Allow "sort" in addition to item query filter keys.
    supported_filters = set(ITEM_QUERY_FILTERS) | {"sort"}

    unknown = [k for k in value.keys() if k not in supported_filters]
    if unknown:
        raise InvalidSettingValueError(f"Unsupported item filter(s): {', '.join(unknown)}.")

    if "purchased" in value and not isinstance(value["purchased"], bool):
        raise InvalidSettingValueError("'purchased' must be true/false.")

    if "not_purchased" in value and not isinstance(value["not_purchased"], bool):
        raise InvalidSettingValueError("'not_purchased' must be true/false.")

    store_values = {c.value for c in Item.Store}
    if "store" in value and value["store"] not in store_values:
        raise InvalidSettingValueError("Invalid 'store' value.")


    if "sort" in value:
        sort_value = value["sort"]
        is_valid_sort = isinstance(sort_value, str) or (
            isinstance(sort_value, list) and all(isinstance(v, str) for v in sort_value)
        )
        if not is_valid_sort:
            raise InvalidSettingValueError("'sort' must be a string or a list of strings.")

    return value


def _validate_calendar_range(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        raise InvalidSettingValueError("'calendar_range' must be an object with 'start_at' and 'end_at'.")

    if "start_at" not in value or "end_at" not in value:
        raise InvalidSettingValueError("'calendar_range' requires both 'start_at' and 'end_at'.")

    try:
        start_at = datetime.fromisoformat(value["start_at"].replace("Z", "+00:00"))
        end_at = datetime.fromisoformat(value["end_at"].replace("Z", "+00:00"))
    except (ValueError, TypeError, AttributeError) as exc:
        raise InvalidSettingValueError("'start_at' and 'end_at' must be valid ISO 8601 datetime strings.") from exc

    if end_at <= start_at:
        raise InvalidSettingValueError("'end_at' must be after 'start_at'.")

    return {
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
    }


SETTING_DEFINITIONS: dict[str, SettingSpec] = {
    "theme": SettingSpec(
        default=ThemeChoices.DARK.value,
        validator=lambda v: _validate_choice("theme", v, THEME_VALUES),
    ),
    "calendar_range": SettingSpec(
        default={},
        validator=_validate_calendar_range,
    ),
    "calendar_filters": SettingSpec(
        default={"view": CalendarChoices.WEEKLY.value},
        validator=_validate_calendar_filters,
    ),
    "item_filters": SettingSpec(
        default={"purchased": False},
        validator=_validate_item_filters,
    ),
}

SUPPORTED_SETTINGS = tuple(SETTING_DEFINITIONS.keys())


def validate_setting_value(key: str, value: Any) -> Any:
    spec = SETTING_DEFINITIONS.get(key)
    if not spec:
        raise UnsupportedSettingError(f"Unsupported setting key: '{key}'.")
    return spec.validator(value)