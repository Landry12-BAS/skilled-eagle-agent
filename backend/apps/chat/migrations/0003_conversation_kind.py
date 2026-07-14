from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0002_conversation_folder_conversation_is_pinned"),
    ]

    operations = [
        migrations.AddField(
            model_name="conversation",
            name="kind",
            field=models.CharField(
                choices=[("chat", "AI Chat"), ("sea", "SEA Task")],
                default="chat",
                max_length=20,
            ),
        ),
    ]
