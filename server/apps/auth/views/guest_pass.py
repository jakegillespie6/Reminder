from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..services.permissions import IsAccountUser
from ..serializers import (
    GuestPassRedeemRequestSerializer,
    GuestPassRedeemResponseSerializer,
    GuestPassStartResponseSerializer,
)
from ..services import create_guest_pass, redeem_guest_pass


class GuestPassView(viewsets.ViewSet):
    @action(
        detail=False,
        methods=["POST"],
        url_path="start",
        permission_classes=[IsAccountUser],
    )
    def start(self, request):
        payload = create_guest_pass(request.user)

        serializer = GuestPassStartResponseSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["POST"],
        url_path="redeem",
        permission_classes=[AllowAny],
    )
    def redeem(self, request):
        serializer = GuestPassRedeemRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = redeem_guest_pass(
            serializer.validated_data["code"]
        )

        response_serializer = GuestPassRedeemResponseSerializer(
            data=payload
        )
        response_serializer.is_valid(raise_exception=True)

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )