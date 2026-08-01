import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.CharField(max_length=200, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)

    REQUIRED_FIELDS = ['email', 'display_name']

    class Meta:
        ordering = ['display_name', 'username']

    def __str__(self):
        return self.display_name or self.username

    @property
    def name(self):
        return self.display_name or self.username