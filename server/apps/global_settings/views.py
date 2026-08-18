from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .serializers import GlobalSettingSerializer, GlobalSettingUpdateSerializer
from .services.base import (
    get_setting,
    set_setting,
    UnsupportedSettingError,
)


class GlobalSettingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_url_kwarg = "key"

    def get_object(self):
        key = self.kwargs.get(self.lookup_url_kwarg)
        try:
            return get_setting(key)
        except UnsupportedSettingError as exc:
            raise NotFound(detail=str(exc)) from exc

    def retrieve(self, request, *args, **kwargs):
        setting = self.get_object()
        return Response(GlobalSettingSerializer(setting).data)

    def update(self, request, *args, **kwargs):
        key = self.kwargs.get(self.lookup_url_kwarg)
        serializer = GlobalSettingUpdateSerializer(
            data=request.data,
            context={"key": key},
        )
        serializer.is_valid(raise_exception=True)

        try:
            setting = set_setting(key, serializer.validated_data["value"])
        except UnsupportedSettingError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        return Response(GlobalSettingSerializer(setting).data, status=status.HTTP_200_OK)
