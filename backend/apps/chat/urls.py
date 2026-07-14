from django.urls import path
from .views import ConversationListCreateView, ConversationDetailView, ConversationUpdateView, MessageTruncateView

urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path("conversations/<int:pk>/update/", ConversationUpdateView.as_view(), name="conversation-update"),
    path("messages/<int:pk>/truncate/", MessageTruncateView.as_view(), name="message-truncate"),
]
