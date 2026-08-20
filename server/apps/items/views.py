from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.auth.services import GuestJWTAuthentication
from common.views import ActionPermissionViewSet

from .serializers import *
from .services.base import (
    create_item,
    get_items,
    update_item,
    delete_item,
)


class ItemViewset(ActionPermissionViewSet):
    authentication_classes = [
        GuestJWTAuthentication,
        JWTAuthentication,
    ]

    permission_classes = [IsAuthenticated]

    permission_action_classes = {
        "list": [AllowAny],
        "create": [IsAuthenticated],
        "partial_update": [IsAuthenticated],
        "destroy": [IsAuthenticated],
    }

    def create(self, request):
        serializer = ItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = create_item(serializer.validated_data)

        return Response(
            ItemSerializer(item).data,
            status=201,
        )

    def list(self, request):
        query_serializer = ItemQuerySerializer(
            data=request.query_params
        )
        query_serializer.is_valid(raise_exception=True)

        filters = dict(query_serializer.validated_data)

        if (
            "purchased" in filters
            and filters["purchased"] is None
        ):
            filters.pop("purchased")

        items = get_items(filters)

        return Response(
            ItemSerializer(items, many=True).data
        )

    def partial_update(self, request, pk=None):
        serializer = ItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = update_item(
            pk,
            serializer.validated_data,
        )

        return Response(
            ItemSerializer(item).data
        )

    def destroy(self, request, pk=None):
        delete_item(pk)

        return Response(status=204)