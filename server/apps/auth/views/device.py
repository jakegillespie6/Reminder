from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from ..serializers import (
    DeviceApproveRequestSerializer,
    DevicePollRequestSerializer,
)
from ..services import (
    device_approve,
    device_poll,
    device_start,
)


class DeviceAuthView(viewsets.ViewSet):
    @action(
        detail=False,
        methods=["POST"],
        url_path="start",
        permission_classes=[AllowAny],
    )
    def start(self, request):
        payload = device_start()
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["POST"],
        url_path="approve",
        permission_classes=[IsAuthenticated],
    )
    def approve(self, request):
        serializer = DeviceApproveRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = device_approve(
            str(serializer.validated_data["session_id"]),
            request.user,
        )

        return Response(payload, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["POST"],
        url_path="poll",
        permission_classes=[AllowAny],
    )
    def poll(self, request):
        serializer = DevicePollRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = device_poll(
            str(serializer.validated_data["session_id"]),
            str(serializer.validated_data["poll_token"]),
        )

        if payload.get("status") == "pending":
            return Response(
                payload,
                status=status.HTTP_202_ACCEPTED,
            )

        return Response(
            payload,
            status=status.HTTP_200_OK,
        )