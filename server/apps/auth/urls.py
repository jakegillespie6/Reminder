from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.google import GoogleAuthView
from .views.base import AuthBaseViewSet

router = DefaultRouter()
router.register('google', GoogleAuthView, basename='google-auth')
router.register('', AuthBaseViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
]