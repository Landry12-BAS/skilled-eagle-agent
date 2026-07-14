import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai.models import AIProvider, AIModel
print("Providers:")
for p in AIProvider.objects.all():
    print(f"- {p.provider_name} (API key: {p.api_key})")
print("\nModels:")
for m in AIModel.objects.all():
    print(f"- {m.provider} / {m.model_id} (active: {m.is_active})")
