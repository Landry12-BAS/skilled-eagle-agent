from django.db import models


class AIProvider(models.Model):
    """Stores provider credentials (one record per provider)."""

    PROVIDER_CHOICES = (
        ('groqcloud',  'GroqCloud'),
        ('gemini',     'Google Gemini'),
        ('openrouter', 'OpenRouter'),
        ('nvidia',     'Nvidia NIM'),
    )

    PROVIDER_ICONS = {
        'groqcloud':  '⚡',
        'gemini':     '✨',
        'openrouter': '🟣',
        'nvidia':     '🟩',
    }

    provider_name = models.CharField(
        max_length=50,
        choices=PROVIDER_CHOICES,
        unique=True,
        verbose_name='Provider',
    )
    api_key = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        verbose_name='API Key',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Provider'
        verbose_name_plural = 'AI Providers'
        ordering = ['provider_name']

    def __str__(self):
        return self.get_provider_name_display()

    def get_active_model(self):
        return self.models.filter(is_active=True).first()


class AIModel(models.Model):
    """A specific model belonging to a provider. One can be active at a time."""

    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='models',
    )
    model_id = models.CharField(max_length=200, verbose_name='Model ID')
    display_name = models.CharField(max_length=200, blank=True, verbose_name='Display Name')
    is_active = models.BooleanField(default=False, verbose_name='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Model'
        verbose_name_plural = 'AI Models'
        unique_together = [('provider', 'model_id')]
        ordering = ['model_id']

    def __str__(self):
        return f'{self.provider} / {self.model_id}'

    def save(self, *args, **kwargs):
        # Allow multiple models to be active simultaneously by removing the logic
        # that sets is_active=False on all other models.
        super().save(*args, **kwargs)


# ── Backward-compatibility shim ──────────────────────────────────────────────
# The consumers.py and providers still use AIProviderConfig.get_active_config()
# This proxy class keeps that interface working.

class AIProviderConfig:
    """Thin proxy that wraps the new AIProvider + AIModel tables."""

    def __init__(self, provider: AIProvider, model: AIModel):
        self.provider_name = provider.provider_name
        self.model_name    = model.model_id if model else None
        self.api_key       = provider.api_key
        self.is_active     = True

    def get_provider_name_display(self):
        return dict(AIProvider.PROVIDER_CHOICES).get(self.provider_name, self.provider_name)

    @classmethod
    def get_active_config(cls):
        active_model = AIModel.objects.filter(is_active=True).select_related('provider').first()
        if active_model:
            return cls(active_model.provider, active_model)
        return None
