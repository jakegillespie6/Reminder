from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('apps.auth.urls')),
    path('items/', include('apps.items.urls')),
    path("global-settings/", include("apps.global_settings.urls")),
    path("events/", include('common.events.urls'))
]
