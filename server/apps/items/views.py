from django.shortcuts import render
from rest_framework import viewsets
from .serializers import *
from .services.base import create_item, get_items, update_item, delete_item
from rest_framework.response import Response

class ItemViewset(viewsets.ViewSet):

    def create(self, request):
        serializer = ItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = create_item(serializer.validated_data)
        return Response(ItemSerializer(item).data, status=201)

    def list(self, request):
        query_serializer = ItemQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        filters = dict(query_serializer.validated_data)
        if "purchased" in filters and filters["purchased"] is None:
            filters.pop("purchased")

        items = get_items(filters)
        return Response(ItemSerializer(items, many=True).data)

    def partial_update(self, request, pk=None):
        serializer = ItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = update_item(pk, serializer.validated_data)
        return Response(ItemSerializer(item).data)

    def destroy(self, request, pk=None):
        delete_item(pk)
        return Response(status=204)

