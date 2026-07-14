import json
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.core import signing
from django.http import HttpResponse
from django.urls import reverse
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

GITHUB_OAUTH_SALT = "sea.github.oauth"


def oauth_popup_response(origin: str, payload: dict):
    fragment = urlencode({"type": "sea-github-oauth", **payload})
    callback_url = json.dumps(f"{origin.rstrip('/')}/github/callback#{fragment}")
    return HttpResponse(
        f"""<!doctype html>
<html>
  <body>
    <script>
      window.location.replace({callback_url});
    </script>
  </body>
</html>""",
        content_type="text/html",
    )


class GitHubOAuthStartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = getattr(settings, "GITHUB_OAUTH_CLIENT_ID", "")
        client_secret = getattr(settings, "GITHUB_OAUTH_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            return Response(
                {"detail": "Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET."},
                status=503,
            )

        allowed_origins = set(getattr(settings, "GITHUB_OAUTH_ALLOWED_ORIGINS", [])) or set(settings.CORS_ALLOWED_ORIGINS)
        origin = request.query_params.get("origin") or request.headers.get("Origin") or next(iter(allowed_origins), "")
        if origin not in allowed_origins:
            return Response({"detail": "Frontend origin is not allowed for GitHub OAuth."}, status=400)

        redirect_uri = getattr(settings, "GITHUB_OAUTH_REDIRECT_URI", "") or request.build_absolute_uri(
            reverse("agent-github-oauth-callback")
        )
        state = signing.dumps(
            {"user_id": request.user.id, "origin": origin, "redirect_uri": redirect_uri},
            salt=GITHUB_OAUTH_SALT,
        )
        params = urlencode(
            {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "scope": getattr(settings, "GITHUB_OAUTH_SCOPE", "repo read:user"),
                "state": state,
            }
        )
        return Response({"authorization_url": f"https://github.com/login/oauth/authorize?{params}"})


class GitHubOAuthCallbackView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        state = request.query_params.get("state", "")
        try:
            state_data = signing.loads(state, salt=GITHUB_OAUTH_SALT, max_age=600)
        except signing.BadSignature:
            return oauth_popup_response(settings.CORS_ALLOWED_ORIGINS[0], {"error": "Invalid or expired GitHub OAuth state."})

        origin = state_data["origin"]
        error = request.query_params.get("error")
        if error:
            description = request.query_params.get("error_description", error)
            return oauth_popup_response(origin, {"error": description})

        code = request.query_params.get("code")
        if not code:
            return oauth_popup_response(origin, {"error": "GitHub did not return an OAuth code."})

        try:
            response = requests.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
                    "client_secret": settings.GITHUB_OAUTH_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": state_data["redirect_uri"],
                },
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException:
            return oauth_popup_response(origin, {"error": "GitHub token exchange failed."})

        access_token = payload.get("access_token")
        if not access_token:
            return oauth_popup_response(origin, {"error": payload.get("error_description") or "GitHub did not return an access token."})

        return oauth_popup_response(
            origin,
            {
                "token": access_token,
                "scope": payload.get("scope", ""),
                "token_type": payload.get("token_type", "bearer"),
            },
        )
