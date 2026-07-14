import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections using SimpleJWT.
    It expects a query string with `?token=<jwt_token>`.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            scope['user'] = AnonymousUser()
            return await self.inner(scope, receive, send)

        try:
            # Validate the token
            UntypedToken(token)
        except (InvalidToken, TokenError) as e:
            logger.error(f"WebSocket token validation error: {e}")
            scope['user'] = AnonymousUser()
            return await self.inner(scope, receive, send)

        # Token is valid, let's decode it
        from rest_framework_simplejwt.state import token_backend
        try:
            decoded_data = token_backend.decode(token, verify=False)
            user_id = decoded_data.get('user_id')
            
            if user_id is None:
                scope['user'] = AnonymousUser()
            else:
                scope['user'] = await get_user(user_id)
        except Exception as e:
            logger.error(f"Error decoding WebSocket token: {e}")
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)
