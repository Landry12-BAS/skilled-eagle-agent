from django.contrib import admin
from django.utils.html import format_html
from django.utils.timezone import localtime
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import action
from django.shortcuts import redirect
from .models import Conversation, ChatMessage


class ChatMessageInline(TabularInline):
    model = ChatMessage
    fields = ("role_badge", "content_preview", "created_at")
    readonly_fields = ("role_badge", "content_preview", "created_at")
    extra = 0
    can_delete = True
    show_change_link = False
    ordering = ("created_at",)

    def role_badge(self, obj):
        colours = {"user": "#6366f1", "assistant": "#22c55e", "system": "#f59e0b"}
        colour = colours.get(obj.role, "#94a3b8")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:9999px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.role.capitalize()
        )
    role_badge.short_description = "Role"

    def content_preview(self, obj):
        return obj.content[:120] + ("…" if len(obj.content) > 120 else "")
    content_preview.short_description = "Content"


@admin.register(Conversation)
class ConversationAdmin(ModelAdmin):
    list_display  = ("title_display", "user", "message_count", "created_at", "updated_at", "delete_icon")
    list_filter   = ("user",)
    search_fields = ("title", "user__username", "user__email")
    inlines       = [ChatMessageInline]
    readonly_fields = ("created_at", "updated_at")
    ordering      = ("-updated_at",)

    # ── Bulk actions ─────────────────────────────────────────────────────────
    actions = ["delete_selected_conversations", "clear_messages_only"]
    actions_detail = ["delete_conversation_detail"]
    actions_selection_counter = False

    @admin.action(description="Delete selected")
    def delete_selected_conversations(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"✓ Deleted {count} conversation(s).")

    @admin.action(description="Clear messages")
    def clear_messages_only(self, request, queryset):
        total = 0
        for conv in queryset:
            deleted, _ = conv.messages.all().delete()
            total += deleted
        self.message_user(request, f"✓ Cleared {total} message(s).")

    @action(description="Delete", url_path="delete-detail")
    def delete_conversation_detail(self, request, object_id):
        conv = self.get_object(request, object_id)
        if conv:
            conv.delete()
            self.message_user(request, "✓ Conversation deleted.")
        return redirect("admin:chat_conversation_changelist")

    @admin.display(description="")
    def delete_icon(self, obj):
        # A direct, clickable red trash can icon linking straight to the delete confirmation page
        return format_html(
            '<a href="/admin/chat/conversation/{}/delete/" '
            'class="text-red-500 hover:text-red-700 transition-colors" '
            'title="Delete Conversation">'
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M3 6h18"></path>'
            '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>'
            '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>'
            '</svg></a>',
            obj.pk
        )

    # ── Display helpers ───────────────────────────────────────────────────────

    @admin.display(description="Title")
    def title_display(self, obj):
        return obj.title or "— Untitled —"

    @admin.display(description="Messages")
    def message_count(self, obj):
        count = obj.messages.count()
        return format_html(
            '<span style="background:#1e1b4b;color:#a5b4fc;padding:2px 10px;'
            'border-radius:9999px;font-size:12px;font-weight:600">{}</span>',
            count
        )


@admin.register(ChatMessage)
class ChatMessageAdmin(ModelAdmin):
    list_display  = ("role_badge", "conversation_link", "content_preview", "created_at")
    list_filter   = ("role", "conversation__user")
    search_fields = ("content", "conversation__title", "conversation__user__username")
    readonly_fields = ("created_at",)
    ordering      = ("-created_at",)
    actions       = ["delete_selected"]

    @admin.display(description="Role")
    def role_badge(self, obj):
        colours = {"user": "#6366f1", "assistant": "#22c55e", "system": "#f59e0b"}
        colour  = colours.get(obj.role, "#94a3b8")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:9999px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.role.capitalize()
        )

    @admin.display(description="Conversation")
    def conversation_link(self, obj):
        return format_html(
            '<a href="/admin/chat/conversation/{}/change/" style="color:#6366f1">{}</a>',
            obj.conversation.pk, obj.conversation.title or "Untitled"
        )

    def content_preview(self, obj):
        return obj.content[:100] + ("…" if len(obj.content) > 100 else "")
    content_preview.short_description = "Content"
