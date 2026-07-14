"""Custom User model with additional fields."""
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Extended user model with role, bio, and profile picture."""
    
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('user', 'User'),
    ]
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user',
        help_text='User role determines permissions',
    )
    bio = models.TextField(
        blank=True,
        null=True,
        help_text='User biography or description',
    )
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        help_text='User profile picture',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_customuser'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class UserMemory(models.Model):
    """
    Stores long-term memory/context for a user that is injected into the AI system prompt.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='memory',
        help_text='User this memory belongs to'
    )
    context = models.TextField(
        blank=True,
        default="",
        help_text='Free-text context facts about the user (preferences, bio, etc.)'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_usermemory'
        verbose_name = 'User Memory'
        verbose_name_plural = 'User Memories'

    def __str__(self):
        return f"Memory for {self.user.email}"
