"""Core URL configuration."""
from django.conf import settings
from django.contrib import admin
from django.conf.urls.static import static
from django.urls import path, include
from apps.core.views import favicon, home

urlpatterns = [
    path('favicon.ico', favicon, name='favicon'),
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.core.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/agent/', include('apps.agent.urls')),
    path('api/', include('apps.clients.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
