from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Conversation, ChatMessage
from .serializers import ConversationSerializer, ConversationDetailSerializer


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/chat/conversations/   — list all conversations for logged-in user
    POST /api/chat/conversations/   — create a new conversation
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        qs = Conversation.objects.filter(user=self.request.user)
        kind = self.request.query_params.get("kind", Conversation.KIND_CHAT).strip()
        if kind in {Conversation.KIND_CHAT, Conversation.KIND_SEA}:
            qs = qs.filter(kind=kind)
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(messages__content__icontains=q)
            ).distinct()
        return qs

    def perform_create(self, serializer):
        kind = self.request.data.get("kind", Conversation.KIND_CHAT)
        if kind not in {Conversation.KIND_CHAT, Conversation.KIND_SEA}:
            kind = Conversation.KIND_CHAT
        serializer.save(user=self.request.user, kind=kind)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/chat/conversations/<id>/  — get full conversation with messages
    DELETE /api/chat/conversations/<id>/  — delete conversation
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return ConversationDetailSerializer


class ConversationUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/chat/conversations/<id>/update/  — update title, folder, or is_pinned
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


class MessageTruncateView(APIView):
    """
    DELETE /api/chat/messages/<id>/truncate/
    Deletes the given message and all subsequent messages in its conversation.
    This is used for 'Regenerate' and 'Edit message' features.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            # Ensure the message belongs to a conversation owned by the user
            message = ChatMessage.objects.get(pk=pk, conversation__user=request.user)
        except ChatMessage.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Delete this message and all messages in the same conversation created after it
        deleted_count, _ = ChatMessage.objects.filter(
            conversation=message.conversation,
            created_at__gte=message.created_at
        ).delete()

        return Response({"detail": f"Deleted {deleted_count} messages."}, status=status.HTTP_200_OK)
