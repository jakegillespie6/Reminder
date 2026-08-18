from rest_framework import serializers
from apps.accounts.api import AccountSerializer


class GoogleTokenRequestSerializer(serializers.Serializer):
    token = serializers.CharField()

class RefreshTokenRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()

class TokenPairSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()

class AuthResponseSerializer(serializers.Serializer):
    tokens = TokenPairSerializer()
    account = AccountSerializer()