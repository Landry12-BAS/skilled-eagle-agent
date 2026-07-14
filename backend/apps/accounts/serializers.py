"""Authentication serializers."""
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """User model serializer with all fields."""

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'bio', 'profile_picture', 'is_staff', 'is_active',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class LoginSerializer(serializers.Serializer):
    """Login serializer for email/password authentication."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        """Authenticate user using email and raise error if credentials are invalid."""
        # Because we added EmailBackend, this will successfully authenticate 
        # using the email address passed as the username parameter.
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password')
        data['user'] = user
        return data


class TokenResponseSerializer(serializers.Serializer):
    """Token response containing access and refresh tokens."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class RefreshTokenSerializer(serializers.Serializer):
    """Refresh token serializer."""

    refresh = serializers.CharField(required=True)


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer."""

    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, data):
        """Validate passwords match."""
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords must match'})
        return data

    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user
