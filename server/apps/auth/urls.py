from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.google import GoogleAuthView
from .views.base import AuthBaseViewSet
from .views.device import DeviceAuthView

router = DefaultRouter()
router.register("google", GoogleAuthView, basename="auth-google")
router.register("base", AuthBaseViewSet, basename="auth-base")
router.register("device", DeviceAuthView, basename="auth-device")

urlpatterns = [
    path('', include(router.urls)),
]