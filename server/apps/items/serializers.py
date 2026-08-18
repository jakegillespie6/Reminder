from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'store', 'type', 'purchased', 'created_at']
        read_only_fields = ['id', 'created_at']

class ItemCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=64, required=True)
    store = serializers.ChoiceField(choices=Item.Store.choices, required=False)
    type = serializers.ChoiceField(choices=Item.ItemType.choices, required=False)

class ItemUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=64, required=False)  # not required for partial update
    store = serializers.ChoiceField(choices=Item.Store.choices, required=False)
    type = serializers.ChoiceField(choices=Item.ItemType.choices, required=False)
    purchased = serializers.BooleanField(required=False)
    
class ItemQuerySerializer(serializers.Serializer):
    SORT_CHOICES = [
        ('created_at', 'Created At (Ascending)'),
        ('-created_at', 'Created At (Descending)'),
        ('store', 'Store'),
        ('type', 'Type'),
    ]

    # Filters - support multiple values
    store = serializers.ListField(
        child=serializers.ChoiceField(choices=Item.Store.choices),
        required=False
    )
    type = serializers.ListField(
        child=serializers.ChoiceField(choices=Item.ItemType.choices),
        required=False
    )

    # Important: allow_null prevents missing query param from becoming False
    purchased = serializers.BooleanField(required=False, allow_null=True)

    # Sort - only one value allowed
    sort = serializers.ChoiceField(choices=SORT_CHOICES, required=False)

    def to_internal_value(self, data):
        mutable_data = data.copy()

        for field in ['store', 'type']:
            if field not in mutable_data:
                continue

            # Supports:
            # ?store=a,b
            # ?store=a&store=b
            raw_values = mutable_data.getlist(field) if hasattr(mutable_data, "getlist") else [mutable_data.get(field)]
            split_values = []
            for raw in raw_values:
                if raw is None:
                    continue
                split_values.extend([v.strip() for v in str(raw).split(",")])

            cleaned = [v for v in split_values if v]
            if cleaned:
                mutable_data.setlist(field, cleaned)
            else:
                mutable_data.pop(field, None)

        for scalar in ["purchased", "sort"]:
            if scalar in mutable_data and str(mutable_data.get(scalar, "")).strip() == "":
                mutable_data.pop(scalar, None)

        return super().to_internal_value(mutable_data)