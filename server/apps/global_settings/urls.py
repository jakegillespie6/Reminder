# urls.py

from django.urls import path

from .views import GlobalSettingViewSet


global_setting_detail = GlobalSettingViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
})


urlpatterns = [
    path(
        "<str:pk>/",
        global_setting_detail,
        name="global-setting-detail",
    ),
]