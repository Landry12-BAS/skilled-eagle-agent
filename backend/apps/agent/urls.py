from django.urls import path

from .views import GitHubOAuthCallbackView, GitHubOAuthStartView

urlpatterns = [
    path("github/oauth/start/", GitHubOAuthStartView.as_view(), name="agent-github-oauth-start"),
    path("github/oauth/callback/", GitHubOAuthCallbackView.as_view(), name="agent-github-oauth-callback"),
]
