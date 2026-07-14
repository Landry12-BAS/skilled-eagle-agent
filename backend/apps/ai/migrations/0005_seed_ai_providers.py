from django.db import migrations


PROVIDERS = ("groqcloud", "gemini", "openrouter", "nvidia")


def seed_ai_providers(apps, schema_editor):
    AIProvider = apps.get_model("ai", "AIProvider")
    for provider_name in PROVIDERS:
        AIProvider.objects.get_or_create(provider_name=provider_name)


class Migration(migrations.Migration):
    dependencies = [
        ("ai", "0004_alter_aiprovider_provider_name"),
    ]

    operations = [
        migrations.RunPython(seed_ai_providers, migrations.RunPython.noop),
    ]
