from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.auth.services import GuestJWTAuthentication
from common.views import ActionPermissionViewSet

from .serializers import (
    GlobalSettingSerializer,
    GlobalSettingUpdateSerializer,
)
from .services.base import (
    get_setting,
    set_setting,
    UnsupportedSettingError,
)


class GlobalSettingViewSet(ActionPermissionViewSet):
    authentication_classes = [
        GuestJWTAuthentication,
        JWTAuthentication,
    ]

    permission_classes = [IsAuthenticated]

    permission_action_classes = {
        "retrieve": [AllowAny],
    }

    def retrieve(self, request, pk=None):
        try:
            setting = get_setting(pk)
        except UnsupportedSettingError as exc:
            raise NotFound(detail=str(exc)) from exc

        return Response(
            GlobalSettingSerializer(setting).data
        )

    def update(self, request, pk=None):
        serializer = GlobalSettingUpdateSerializer(
            data=request.data,
            context={"key": pk},
        )
        serializer.is_valid(raise_exception=True)

        try:
            setting = set_setting(
                pk,
                serializer.validated_data["value"],
            )
        except UnsupportedSettingError as exc:
            raise ValidationError(
                {"detail": str(exc)}
            ) from exc

        return Response(
            GlobalSettingSerializer(setting).data,
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, pk=None):
        return self.update(request, pk)