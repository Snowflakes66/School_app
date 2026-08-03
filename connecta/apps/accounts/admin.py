from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'display_name', 'email', 'is_online', 'is_staff']
    search_fields = ['username', 'display_name', 'email']
    fieldsets = UserAdmin.fieldsets + (
        ('Connecta', {'fields': ('display_name', 'avatar_url', 'bio', 'is_online', 'last_seen')}),
    )