from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet, GoogleCalendarWebhookView

router = DefaultRouter()
router.register("", CalendarEventViewSet, basename="calendar-events")

urlpatterns = router.urls + [
    path("webhook/google/", GoogleCalendarWebhookView.as_view(), name="google-webhook"),
]