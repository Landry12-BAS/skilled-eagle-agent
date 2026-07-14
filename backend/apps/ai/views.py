"""Live model-listing views for AI providers."""
import logging
import requests
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required

logger = logging.getLogger(__name__)


def _fetch_nvidia_models(api_key: str) -> list:
    """Fetch available models from Nvidia NIM."""
    try:
        resp = requests.get(
            "https://integrate.api.nvidia.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return sorted([
            {"id": m.get("id"), "name": m.get("id")}
            for m in data
        ], key=lambda x: x["id"])
    except Exception as e:
        logger.error(f"Nvidia model list error: {e}")
        return []


def _fetch_openrouter_models(api_key: str) -> list:
    """Fetch available models from OpenRouter."""
    try:
        resp = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])

        models = []
        for m in data:
            model_id = m.get("id", "")
            name = m.get("name", model_id)
            pricing = m.get("pricing", {})
            is_free = (
                str(pricing.get("prompt", "1")) == "0" and
                str(pricing.get("completion", "1")) == "0"
            )
            label = f"{'🆓 ' if is_free else ''}{name}"
            models.append({"id": model_id, "name": label, "free": is_free})

        # Free models first, then alphabetical
        models.sort(key=lambda x: (not x["free"], x["id"]))
        return models
    except Exception as e:
        logger.error(f"OpenRouter model list error: {e}")
        return []


def _fetch_groq_models(api_key: str) -> list:
    """Fetch available models from GroqCloud."""
    try:
        resp = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return sorted([
            {"id": m.get("id"), "name": m.get("id")}
            for m in data
        ], key=lambda x: x["id"])
    except Exception as e:
        logger.error(f"Groq model list error: {e}")
        return []


def _fetch_gemini_models(api_key: str) -> list:
    """Fetch available models from Google Gemini."""
    try:
        resp = requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=10,
        )
        resp.raise_for_status()
        models = resp.json().get("models", [])
        supported_models = [
            {"id": m.get("name").replace("models/", ""), "name": m.get("displayName", m.get("name").replace("models/", ""))}
            for m in models
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        return sorted(supported_models, key=lambda x: x["id"])
    except Exception as e:
        logger.error(f"Gemini model list error: {e}")
        return []


@staff_member_required
def list_provider_models(request):
    """
    GET /api/ai/models/?config_id=1           — use key stored in DB
    GET /api/ai/models/?provider=X&api_key=Y  — use key passed directly

    Returns JSON list of available models for the provider.
    """
    from .models import AIProvider

    config_id = request.GET.get("config_id", "").strip()
    provider  = request.GET.get("provider",  "").strip()
    api_key   = request.GET.get("api_key",   "").strip()

    # If a config_id is given, read the saved key from the database
    if config_id:
        try:
            config  = AIProvider.objects.get(pk=config_id)
            api_key = config.api_key or ""
            if not provider:
                provider = config.provider_name
        except AIProvider.DoesNotExist:
            return JsonResponse({"error": "Provider not found"}, status=404)

    if not provider or not api_key:
        return JsonResponse({"error": "provider and api_key are required"}, status=400)

    fetchers = {
        "nvidia":     _fetch_nvidia_models,
        "openrouter": _fetch_openrouter_models,
        "groqcloud":  _fetch_groq_models,
        "gemini":     _fetch_gemini_models,
    }

    fetcher = fetchers.get(provider)
    if not fetcher:
        return JsonResponse({"models": [], "error": f"No live listing for provider '{provider}'"})

    models = fetcher(api_key)
    return JsonResponse({"models": models})



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response as DRFResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_active_models(request):
    """
    GET /api/ai/active-models/
    Returns all AIModel rows marked is_active=True, for the frontend model selector.
    Any authenticated user can call this.
    """
    from .models import AIModel
    models = AIModel.objects.filter(is_active=True).select_related('provider').order_by('provider__provider_name', 'model_id')
    data = [
        {
            "id": m.pk,
            "model_id": m.model_id,
            "display_name": m.display_name or m.model_id,
            "provider": m.provider.provider_name,
            "provider_label": m.provider.get_provider_name_display(),
        }
        for m in models
    ]
    return DRFResponse({"models": data})
