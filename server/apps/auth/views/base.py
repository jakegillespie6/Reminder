from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.accounts.api import AccountSerializer
from ..serializers import RefreshTokenRequestSerializer
from ..services import refresh_tokens



class AuthBaseViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['GET'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(AccountSerializer(request.user).data, status=200)

    @action(detail=False, methods=['POST'], url_path='refresh-token', permission_classes=[AllowAny])
    def refresh_token(self, request):
        serializer = RefreshTokenRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = refresh_tokens(serializer.validated_data['refresh'])
        return Response(payload, status=200)