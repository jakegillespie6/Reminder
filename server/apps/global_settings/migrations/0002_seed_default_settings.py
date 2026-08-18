from django.db import migrations


def seed_defaults(apps, schema_editor):
    GlobalSetting = apps.get_model("global_settings", "GlobalSetting")

    defaults = {
        "theme": "dark",
        "calendar": "weekly",
        "item_filters": {"purchased": False},
    }

    for key, value in defaults.items():
        GlobalSetting.objects.update_or_create(
            key=key,
            defaults={"value": value},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("global_settings", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_defaults, migrations.RunPython.noop),
    ]