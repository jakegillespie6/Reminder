from django.db import models


class ThemeChoices(models.TextChoices):
    LIGHT = "light", "Light"
    DARK = "dark", "Dark"
    ABYSSAL = "abyssal", "Abyssal"

class CalendarChoices(models.TextChoices):
    DAILY = 'daily', 'Daily'
    WEEKLY = 'weekly', 'Weekly'
    MONTHLY = 'monthly', 'Monthly'
    
class GlobalSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Global Settings"
        ordering = ["key"]
        db_table = "global_settings"

    def __str__(self) -> str:
        return f"{self.key}={self.value}"
