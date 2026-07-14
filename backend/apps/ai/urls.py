"""AI app URLs."""
from django.urls import path
from . import views
from .transcribe import transcribe_audio

app_name = 'ai'

urlpatterns = [
    path('models/', views.list_provider_models, name='list_models'),
    path('active-models/', views.list_active_models, name='active_models'),
    path('transcribe/', transcribe_audio, name='transcribe_audio'),
]

