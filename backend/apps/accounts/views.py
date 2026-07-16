"""Authentication views."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from .serializers import (
    LoginSerializer, TokenResponseSerializer, UserSerializer,
    RegisterSerializer
)
from .models import CustomUser


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint. Accept email and password, return access/refresh tokens.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']

    refresh = RefreshToken.for_user(user)
    response_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registration endpoint. Create new user account.
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    response_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """
    Refresh token endpoint. Accept refresh token, return new access token.
    """
    serializer = TokenRefreshSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.validated_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint. Mark refresh token as blacklisted (if enabled).
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            from rest_framework_simplejwt.tokens import RefreshToken
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {'detail': 'Successfully logged out'},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Get current user info with all fields."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Update user profile (bio, profile_picture)."""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    if 'password' in request.data:
        user.set_password(request.data['password'])
        user.save()
        serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def memory_view(request):
    """Get or update user memory."""
    from .models import UserMemory
    memory, _ = UserMemory.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        context = request.data.get('context', '')
        memory.context = context
        memory.save()
        return Response({'context': memory.context})
        
    return Response({'context': memory.context})
