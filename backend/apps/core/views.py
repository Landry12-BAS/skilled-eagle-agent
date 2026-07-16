"""Core app views."""
from django.shortcuts import redirect, render
from django.templatetags.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


def home(request):
    """Backend landing page."""
    return render(request, 'core/home.html')


def favicon(request):
    """Serve the shared Skilled Eagle favicon at the browser default path."""
    return redirect(static('core/favicon.png'), permanent=False)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for monitoring."""
    return Response({
        'status': 'ok',
        'service': 'Django API',
        'timestamp': timezone.now().isoformat(),
    })
