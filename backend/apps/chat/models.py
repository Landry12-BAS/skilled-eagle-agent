from django.db import models
from django.conf import settings


class Conversation(models.Model):
    KIND_CHAT = "chat"
    KIND_SEA = "sea"
    KIND_CHOICES = [
        (KIND_CHAT, "AI Chat"),
        (KIND_SEA, "SEA Task"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations"
    )
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default=KIND_CHAT)
    title = models.CharField(max_length=255, blank=True, default="New Conversation")
    folder = models.CharField(max_length=50, blank=True, default="")
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

    def __str__(self):
        return f"{self.user.username} — {self.title}"


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"

    def __str__(self):
        return f"[{self.role}] {self.content[:60]}"
