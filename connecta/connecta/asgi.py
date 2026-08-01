"""
ASGI config for connecta project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'connecta.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.realtime.middleware import JWTAuthMiddleware
import apps.realtime.routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': JWTAuthMiddleware(
        URLRouter(
            apps.realtime.routing.websocket_urlpatterns
        )
    ),
})