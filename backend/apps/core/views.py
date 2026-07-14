"""Core app views."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for monitoring."""
    return Response({
        'status': 'ok',
        'service': 'Django API',
        'timestamp': timezone.now().isoformat(),
    })
