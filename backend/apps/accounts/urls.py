"""Accounts app URLs."""
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('token/refresh/', views.token_refresh_view, name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
    path('memory/', views.memory_view, name='memory'),
]
