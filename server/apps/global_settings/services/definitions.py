from dataclasses import dataclass
from typing import Any, Callable

from apps.items.models import ITEM_QUERY_FILTERS, Item
from ..models import ThemeChoices, CalendarChoices


class UnsupportedSettingError(Exception):
    pass


class InvalidSettingValueError(Exception):
    pass


Validator = Callable[[Any], Any]


@dataclass(frozen=True)
class SettingSpec:
    default: Any
    validator: Validator


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

    type_values = {c.value for c in Item.ItemType}
    if "type" in value and value["type"] not in type_values:
        raise InvalidSettingValueError("Invalid 'type' value.")

    if "sort" in value:
        sort_value = value["sort"]
        is_valid_sort = isinstance(sort_value, str) or (
            isinstance(sort_value, list) and all(isinstance(v, str) for v in sort_value)
        )
        if not is_valid_sort:
            raise InvalidSettingValueError("'sort' must be a string or a list of strings.")

    return value


THEME_VALUES = {c.value for c in ThemeChoices}
CALENDAR_VALUES = {c.value for c in CalendarChoices}

SETTING_DEFINITIONS: dict[str, SettingSpec] = {
    "theme": SettingSpec(
        default=ThemeChoices.DARK,
        validator=lambda v: _validate_choice("theme", v, THEME_VALUES),
    ),
    "calendar": SettingSpec(
        default=CalendarChoices.WEEKLY,
        validator=lambda v: _validate_choice("calendar", v, CALENDAR_VALUES),
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