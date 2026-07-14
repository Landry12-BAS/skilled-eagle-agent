"""Django Admin configuration for accounts."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .models import CustomUser

# Unregister default Group so we can re-register it with Unfold
admin.site.unregister(Group)

@admin.register(Group)
class GroupAdmin(ModelAdmin, BaseGroupAdmin):
    pass

from django import forms
from django.utils.safestring import mark_safe

class ProPasswordWidget(forms.Widget):
    def render(self, name, value, attrs=None, renderer=None):
        return mark_safe(
            '<div style="font-size: 13px; line-height: 1.5; margin-top: 4px;">'
            'Raw passwords are not stored, so there is no way to see this user’s password, '
            'but you can change the password using <a href="../password/" style="font-weight: 600; text-decoration: underline;">this form</a>.<br>'
            '<div style="margin-top: 8px; padding: 8px 12px; background: rgba(0,0,0,0.03); border-radius: 6px; display: inline-block; font-family: monospace; letter-spacing: 2px;">'
            '****************'
            '</div></div>'
        )

from django.contrib.auth.forms import ReadOnlyPasswordHashField

class CustomUserChangeForm(UserChangeForm):
    password = ReadOnlyPasswordHashField(
        label="Password",
        widget=ProPasswordWidget,
    )
    
    class Meta(UserChangeForm.Meta):
        model = CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(ModelAdmin, BaseUserAdmin):
    """Admin interface for CustomUser model."""
    form = CustomUserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = (
        'email', 'first_name', 'last_name', 'role', 'is_staff',
        'is_active', 'created_at'
    )
    list_filter = ('role', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)

    fieldsets = (
        ('Personal Info', {
            'fields': ('username', 'password', 'email', 'first_name', 'last_name')
        }),
        ('User Settings', {
            'fields': ('role', 'bio', 'profile_picture')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'role'
            ),
        }),
    )

    actions = ['make_admin', 'make_manager', 'make_user', 'activate_users', 'deactivate_users']

    def make_admin(self, request, queryset):
        """Bulk action to set users as admin."""
        updated = queryset.update(role='admin', is_staff=True)
        self.message_user(request, f'{updated} users set to admin.')
    make_admin.short_description = 'Set selected users as admin'

    def make_manager(self, request, queryset):
        """Bulk action to set users as manager."""
        updated = queryset.update(role='manager', is_staff=True)
        self.message_user(request, f'{updated} users set to manager.')
    make_manager.short_description = 'Set selected users as manager'

    def make_user(self, request, queryset):
        """Bulk action to set users as regular user."""
        updated = queryset.update(role='user', is_staff=False)
        self.message_user(request, f'{updated} users set to regular user.')
    make_user.short_description = 'Set selected users as user'

    def activate_users(self, request, queryset):
        """Bulk action to activate users."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users activated.')
    activate_users.short_description = 'Activate selected users'

    def deactivate_users(self, request, queryset):
        """Bulk action to deactivate users."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users deactivated.')
    deactivate_users.short_description = 'Deactivate selected users'
