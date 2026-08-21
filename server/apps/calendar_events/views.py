from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account
from .models import CalendarEvent
from .serializers import (
    CalendarEventSerializer,
    EventOccurrenceSerializer,
    EventRangeQuerySerializer,
)
from .services.base import list_events_in_range
from .services.google_sync import (
    full_sync_google_calendar,
    incremental_sync_google_calendar,
    setup_push_notifications,
    stop_push_notifications,
)


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer

    @action(detail=False, methods=["get"], url_path="within-range")
    def within_range(self, request):
        query = EventRangeQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)

        start_at = query.start_at
        end_at = query.end_at
        expand = query.validated_data["expand_recurrence"]

        qs = CalendarEvent.objects.within_window(start_at, end_at).order_by("start_at")
        rows = list_events_in_range(
            queryset=qs,
            start_at=start_at,
            end_at=end_at,
            expand_recurrence=expand,
        )

        if expand:
            return Response(EventOccurrenceSerializer(rows, many=True).data)

        return Response(CalendarEventSerializer(rows, many=True).data)

    @action(detail=False, methods=["post"], url_path="google/full-sync")
    def google_full_sync(self, request):
        """Perform a full sync with Google Calendar."""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not request.user.google_id:
            return Response(
                {"error": "Google account not linked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            created_count, sync_token = full_sync_google_calendar(request.user)
            return Response({
                "created": created_count,
                "message": "Full sync completed",
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"], url_path="google/setup-watch")
    def google_setup_watch(self, request):
        """Set up push notifications for Google Calendar changes."""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not request.user.google_id:
            return Response(
                {"error": "Google account not linked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Do full sync first if no sync token
            if not request.user.google_sync_token:
                full_sync_google_calendar(request.user)

            # Set up watch
            result = setup_push_notifications(request.user)
            return Response({
                "channel_id": result.get("id"),
                "expiration": request.user.google_channel_expiration,
                "message": "Watch channel created",
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"], url_path="google/stop-watch")
    def google_stop_watch(self, request):
        """Stop push notifications for Google Calendar."""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            stop_push_notifications(request.user)
            return Response({"message": "Watch channel stopped"})
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class GoogleCalendarWebhookView(APIView):
    """
    Webhook endpoint for Google Calendar push notifications.
    Google sends POST requests here when calendar events change.
    """
    authentication_classes = []  # No auth - Google can't authenticate
    permission_classes = []

    def post(self, request):
        # Google sends these headers
        channel_id = request.headers.get("X-Goog-Channel-ID", "")
        resource_state = request.headers.get("X-Goog-Resource-State", "")
        channel_token = request.headers.get("X-Goog-Channel-Token", "")

        # Parse account ID from token
        account_id = None
        if channel_token:
            for part in channel_token.split("&"):
                if part.startswith("account_id="):
                    try:
                        account_id = int(part.split("=")[1])
                    except ValueError:
                        pass

        # Handle sync notification (initial confirmation)
        if resource_state == "sync":
            return Response(status=status.HTTP_200_OK)

        # Handle actual changes
        if resource_state in ("exists", "update"):
            if account_id:
                try:
                    account = Account.objects.get(
                        id=account_id,
                        google_channel_id=channel_id,
                    )
                    # Perform incremental sync
                    incremental_sync_google_calendar(account)
                except Account.DoesNotExist:
                    pass  # Invalid channel, ignore

        return Response(status=status.HTTP_200_OK)
