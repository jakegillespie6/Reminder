from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.auth.services import GuestJWTAuthentication
from common.views import ActionPermissionViewSet

from .models import CalendarEvent

from .serializers import (
    CalendarEventSerializer,
    CalendarEventQuerySerializer,
    EventOccurrenceSerializer,
    CalendarEventOccurrenceUpdateSerializer,
    CalendarEventOccurrenceDeleteSerializer,
)

from .services.base import (
    create_event,
    update_event,
    delete_event,
    list_events_in_range,
    update_event_occurrence,
    delete_event_occurrence,
)


class CalendarEventViewSet(ActionPermissionViewSet):

    permission_classes = [
        AllowAny,
    ]

    permission_action_classes = {
        "list": [AllowAny],

        "create": [AllowAny],
        "partial_update": [AllowAny],
        "destroy": [AllowAny],

        "update_occurrence": [AllowAny],
        "delete_occurrence": [AllowAny],
    }

    def create(self, request):
        serializer = CalendarEventSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        event = create_event(
            serializer.validated_data
        )

        return Response(
            CalendarEventSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )

    def list(self, request):
        query_serializer = CalendarEventQuerySerializer(
            data=request.query_params
        )

        query_serializer.is_valid(
            raise_exception=True
        )

        filters = query_serializer.validated_data

        qs = (
            CalendarEvent.objects
            .all()
            .prefetch_related("exceptions")
        )

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        expand = filters.get(
            "expand_recurrence",
            True,
        )

        if start_date and end_date:
            qs = (
                qs
                .within_window(
                    start_date,
                    end_date,
                )
                .order_by("start_date")
            )

            rows = list_events_in_range(
                queryset=qs,
                start_date=start_date,
                end_date=end_date,
                expand_recurrence=expand,
            )

            if expand:
                return Response(
                    EventOccurrenceSerializer(
                        rows,
                        many=True,
                    ).data
                )

            return Response(
                CalendarEventSerializer(
                    rows,
                    many=True,
                ).data
            )

        return Response(
            CalendarEventSerializer(
                qs,
                many=True,
            ).data
        )

    def partial_update(
        self,
        request,
        pk=None,
    ):
        event = CalendarEvent.objects.get(
            pk=pk
        )

        serializer = CalendarEventSerializer(
            event,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        event = update_event(
            pk,
            serializer.validated_data,
        )

        return Response(
            CalendarEventSerializer(event).data
        )

    def destroy(
        self,
        request,
        pk=None,
    ):
        delete_event(pk)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class CalendarEventOccurrenceViewSet(ActionPermissionViewSet):
    permission_classes = [AllowAny]

    def partial_update(self, request, pk=None):
        serializer = CalendarEventOccurrenceUpdateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        occurrence = update_event_occurrence(
            event_id=pk,
            data=serializer.validated_data,
        )

        return Response(
            EventOccurrenceSerializer(occurrence).data
        )

    def destroy(self, request, pk=None):
        data = request.data.copy()

        if (
            "occurrence_date" not in data
            and request.query_params.get("occurrence_date")
        ):
            data["occurrence_date"] = request.query_params[
                "occurrence_date"
            ]

        serializer = CalendarEventOccurrenceDeleteSerializer(
            data=data
        )
        serializer.is_valid(raise_exception=True)

        delete_event_occurrence(
            event_id=pk,
            occurrence_date=serializer.validated_data[
                "occurrence_date"
            ],
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )