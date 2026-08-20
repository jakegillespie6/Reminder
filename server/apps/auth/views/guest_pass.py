from datetime import timedelta
from secrets import token_urlsafe

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from ..serializers import (
    GuestPassRedeemRequestSerializer,
    GuestPassStartResponseSerializer,
    GuestPassRedeemResponseSerializer,
)
from ..services import create_guest_pass, redeem_guest_pass
from django.contrib.auth import get_user_model

User = get_user_model()
GUEST_PASS_TTL_SECONDS = 30 * 60

class GuestPassView(viewsets.ViewSet):
    @action(detail=False, methods=["POST"], url_path="start", permission_classes=[IsAuthenticated])
    def start(self, request):
        payload = create_guest_pass(request.user)

        response_serializer = GuestPassStartResponseSerializer(data=payload)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["POST"], url_path="redeem", permission_classes=[AllowAny])
    def redeem(self, request):
        serializer = GuestPassRedeemRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = redeem_guest_pass(serializer.validated_data["code"])

        response_serializer = GuestPassRedeemResponseSerializer(data=payload)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)