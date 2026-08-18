from django.urls import path

from .views import GlobalSettingDetailView

urlpatterns = [
    path("<str:key>/", GlobalSettingDetailView.as_view(), name="global-setting-detail"),
]