from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CalendarEventViewSet,
    CalendarEventOccurrenceViewSet,
)

router = DefaultRouter()
router.register(
    "",
    CalendarEventViewSet,
    basename="calendar-events",
)

urlpatterns = [
    path(
        "<int:pk>/occurrence/",
        CalendarEventOccurrenceViewSet.as_view({
            "patch": "partial_update",
            "delete": "destroy",
        }),
        name="calendar-event-occurrence",
    ),
    *router.urls,
]