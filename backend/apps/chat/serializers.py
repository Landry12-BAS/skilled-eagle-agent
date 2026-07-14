from rest_framework import serializers
from .models import Conversation, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "kind", "title", "folder", "is_pinned", "created_at", "updated_at", "message_count", "last_message"]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return last.content[:100]
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "kind", "title", "folder", "is_pinned", "created_at", "updated_at", "messages"]
