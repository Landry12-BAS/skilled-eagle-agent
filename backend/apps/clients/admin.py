from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Client

@admin.register(Client)
class ClientAdmin(ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'company', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('first_name', 'last_name', 'email', 'company')
