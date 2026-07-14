from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from unfold.admin import ModelAdmin
from .models import AIProvider, AIModel


# ── Helper: mask API key ──────────────────────────────────────────────────────

def _mask_key(key):
    if not key or len(key) < 8:
        return '••••••••'
    return key[:4] + '••••••••' + key[-4:]


# ── Provider card admin view ──────────────────────────────────────────────────

@admin.register(AIProvider)
class AIProviderAdmin(ModelAdmin):
    list_display  = ('provider_name', 'has_key', 'active_model', 'updated_at')
    list_filter   = ('provider_name',)

    def has_key(self, obj):
        return bool(obj.api_key)
    has_key.boolean = True
    has_key.short_description = 'API Key'

    def active_model(self, obj):
        m = obj.get_active_model()
        return m.model_id if m else '—'
    active_model.short_description = 'Active Model'

    # ── Custom URLs ──────────────────────────────────────────────────────────

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('cards/',                         self.admin_site.admin_view(self.card_view),      name='ai_provider_cards'),
            path('<int:pk>/update-key/',            self.admin_site.admin_view(self.update_key),     name='ai_provider_update_key'),
            path('<int:pk>/add-model/',             self.admin_site.admin_view(self.add_model),      name='ai_provider_add_model'),
            path('<int:pk>/model/<int:model_pk>/delete/',   self.admin_site.admin_view(self.delete_model),   name='ai_model_delete'),
            path('<int:pk>/model/<int:model_pk>/activate/', self.admin_site.admin_view(self.activate_model), name='ai_model_activate'),
        ]
        return custom + urls

    def changelist_view(self, request, extra_context=None):
        """Always redirect the standard list view to the card view."""
        return redirect('admin:ai_provider_cards')

    # ── Card overview page ───────────────────────────────────────────────────

    def card_view(self, request):
        providers = AIProvider.objects.prefetch_related('models').order_by('provider_name')
        context = dict(
            self.admin_site.each_context(request),
            title='AI Providers',
            providers=providers,
            mask_key=_mask_key,
        )
        return render(request, 'admin/ai/provider_cards.html', context)

    # ── AJAX: update API key ─────────────────────────────────────────────────

    def update_key(self, request, pk):
        if request.method != 'POST':
            return JsonResponse({'error': 'POST only'}, status=405)
        provider = get_object_or_404(AIProvider, pk=pk)
        new_key  = request.POST.get('api_key', '').strip()
        if new_key:
            provider.api_key = new_key
            provider.save(update_fields=['api_key', 'updated_at'])
        return JsonResponse({'ok': True, 'masked': _mask_key(provider.api_key)})

    # ── AJAX: add model ──────────────────────────────────────────────────────

    def add_model(self, request, pk):
        if request.method != 'POST':
            return JsonResponse({'error': 'POST only'}, status=405)
        provider   = get_object_or_404(AIProvider, pk=pk)
        model_id   = request.POST.get('model_id', '').strip()
        activate   = request.POST.get('activate', 'false') == 'true'
        if not model_id:
            return JsonResponse({'error': 'model_id required'}, status=400)
        model, _ = AIModel.objects.get_or_create(provider=provider, model_id=model_id)
        if activate:
            model.is_active = True
            model.save(update_fields=['is_active'])
        return JsonResponse({'ok': True, 'model_pk': model.pk, 'model_id': model.model_id, 'is_active': model.is_active})

    # ── AJAX: delete model ───────────────────────────────────────────────────

    def delete_model(self, request, pk, model_pk):
        if request.method != 'POST':
            return JsonResponse({'error': 'POST only'}, status=405)
        model = get_object_or_404(AIModel, pk=model_pk)
        model.delete()
        return JsonResponse({'ok': True})

    # ── AJAX: activate model ─────────────────────────────────────────────────

    def activate_model(self, request, pk, model_pk):
        if request.method != 'POST':
            return JsonResponse({'error': 'POST only'}, status=405)
        model = get_object_or_404(AIModel, pk=model_pk)
        model.is_active = not model.is_active
        model.save(update_fields=['is_active'])
        return JsonResponse({'ok': True, 'is_active': model.is_active})


@admin.register(AIModel)
class AIModelAdmin(ModelAdmin):
    list_display  = ('model_id', 'provider', 'is_active')
    list_filter   = ('provider', 'is_active')
    search_fields = ('model_id',)

    def has_module_perms(self, request):
        """Hide AIModel from the admin index — managed via provider cards."""
        return False
