from django.db import transaction
from django.shortcuts import get_object_or_404
from common.events.services import broker
from ..models import Item

def _item_payload(item: Item) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "store": item.store,
        "type": item.type,
        "purchased": item.purchased,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }

def create_item(data) -> Item:
    item = Item.objects.create(**data)
    payload = _item_payload(item)
    transaction.on_commit(
        lambda payload=payload: broker.publish(
            topic="items",
            event_name="item.created",
            payload=payload,
        )
    )
    return item

ALLOWED_SORTS = {"created_at", "-created_at", "store", "type"}

def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"true", "1", "yes", "on"}:
            return True
        if v in {"false", "0", "no", "off"}:
            return False
    return None

def _to_list(value):
    if value is None:
        return None
    if isinstance(value, str):
        parts = [v.strip() for v in value.split(",")]
        cleaned = [v for v in parts if v]
        return cleaned or None
    if isinstance(value, (list, tuple)):
        cleaned = [str(v).strip() for v in value if str(v).strip()]
        return cleaned or None
    return None

def get_items(filters: dict):
    queryset = Item.objects.all()

    # Defensive normalization (even if caller bypasses serializer)
    purchased = _to_bool(filters.get("purchased", None))
    stores = _to_list(filters.get("store", None))
    types = _to_list(filters.get("type", None))
    sort = filters.get("sort", None)

    if purchased is not None:
        queryset = queryset.filter(purchased=purchased)

    if stores:
        queryset = queryset.filter(store__in=stores)

    if types:
        queryset = queryset.filter(type__in=types)

    if isinstance(sort, str) and sort in ALLOWED_SORTS:
        queryset = queryset.order_by(sort)

    return queryset[:50]

def update_item(item_id: int, data: dict) -> Item:
    item = get_object_or_404(Item, id=item_id)
    for key, value in data.items():
        setattr(item, key, value)
    item.save()

    payload = _item_payload(item)
    transaction.on_commit(
        lambda payload=payload: broker.publish(
            topic="items",
            event_name="item.updated",
            payload=payload,
        )
    )
    return item

def delete_item(item_id: int) -> None:
    item = get_object_or_404(Item, id=item_id)
    deleted_payload = {"id": item.id}
    item.delete()

    transaction.on_commit(
        lambda payload=deleted_payload: broker.publish(
            topic="items",
            event_name="item.deleted",
            payload=payload,
        )
    )