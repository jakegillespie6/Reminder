from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from ..serializers import GoogleTokenRequestSerializer, RefreshTokenRequestSerializer, AuthResponseSerializer
from ..services import (
    sign_in_with_google,
    sign_out_with_refresh,
    sign_up_with_google,
)


class GoogleAuthView(viewsets.ViewSet):
    @action(detail=False, methods=['POST'], url_path='sign-in', permission_classes=[AllowAny])
    def sign_in(self, request):
        serializer = GoogleTokenRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = sign_in_with_google(serializer.validated_data['token'])
        return Response(AuthResponseSerializer(payload).data, status=200)

    @action(detail=False, methods=['POST'], url_path='sign-up', permission_classes=[AllowAny])
    def sign_up(self, request):
        serializer = GoogleTokenRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = sign_up_with_google(serializer.validated_data['token'])
        return Response(AuthResponseSerializer(payload).data, status=201)

    @action(detail=False, methods=['POST'], url_path='sign-out', permission_classes=[IsAuthenticated])
    def sign_out(self, request):
        serializer = RefreshTokenRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = sign_out_with_refresh(serializer.validated_data['refresh'])
        return Response(payload, status=200)

