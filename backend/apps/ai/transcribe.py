"""Audio transcription endpoint using Groq Whisper (free, fast)."""
import logging
import tempfile
import os
import requests

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AIProvider

logger = logging.getLogger(__name__)


def _transcribe_with_groq(api_key: str, audio_file_path: str, language: str = "en") -> str:
    """Send audio to Groq's Whisper endpoint for transcription."""
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {api_key}"}

    with open(audio_file_path, "rb") as f:
        files = {"file": (os.path.basename(audio_file_path), f, "audio/webm")}
        data = {
            "model": "whisper-large-v3",
            "language": language[:2] if language else "en",
            "response_format": "json",
        }
        resp = requests.post(url, headers=headers, files=files, data=data, timeout=30)
        resp.raise_for_status()
        return resp.json().get("text", "")


def _transcribe_with_gemini(api_key: str, audio_file_path: str, language: str = "en") -> str:
    """Fallback: use Gemini to transcribe audio by sending it as inline data."""
    import google.generativeai as genai
    import base64

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    with open(audio_file_path, "rb") as f:
        audio_data = f.read()

    audio_part = {
        "mime_type": "audio/webm",
        "data": base64.b64encode(audio_data).decode("utf-8"),
    }

    lang_name = language if len(language) > 2 else "the spoken language"
    response = model.generate_content(
        [
            f"Transcribe the following audio accurately. Output ONLY the transcribed text, nothing else. The language is {lang_name}.",
            audio_part,
        ]
    )
    return response.text.strip()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transcribe_audio(request):
    """
    POST /api/ai/transcribe/
    Body: multipart form with 'audio' file and optional 'language' field.
    Returns: {"text": "transcribed text"}

    Tries Groq Whisper first (fast, free), then Gemini as fallback.
    """
    audio = request.FILES.get("audio")
    if not audio:
        return Response({"error": "No audio file provided."}, status=400)

    language = request.POST.get("language", "en")

    # Save uploaded audio to a temp file
    suffix = ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in audio.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        # Try Groq first (has Whisper)
        try:
            groq_provider = AIProvider.objects.get(provider_name="groqcloud")
            if groq_provider.api_key:
                text = _transcribe_with_groq(groq_provider.api_key, tmp_path, language)
                if text:
                    return Response({"text": text})
        except AIProvider.DoesNotExist:
            pass
        except Exception as e:
            logger.warning(f"Groq transcription failed: {e}")

        # Fallback to Gemini
        try:
            gemini_provider = AIProvider.objects.get(provider_name="gemini")
            if gemini_provider.api_key:
                text = _transcribe_with_gemini(gemini_provider.api_key, tmp_path, language)
                if text:
                    return Response({"text": text})
        except AIProvider.DoesNotExist:
            pass
        except Exception as e:
            logger.warning(f"Gemini transcription failed: {e}")

        return Response(
            {"error": "No transcription provider available. Please configure Groq or Gemini in the admin panel."},
            status=503,
        )
    finally:
        os.unlink(tmp_path)
