from django.contrib import admin
from .models import GlobalSetting


@admin.register(GlobalSetting)
class GlobalSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "value", "updated_at")
    search_fields = ("key",)
    readonly_fields = ("updated_at",)
    ordering = ("key",)

    # Optional: keep settings rows non-deletable from admin
    def has_delete_permission(self, request, obj=None):
        return False
