"""
Root URL configuration — BACKEND (API only).
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'name': 'DriveNow Car Rental API',
        'status': 'ok',
        'api': request.build_absolute_uri('/api/'),
    })


urlpatterns = [
    path('', api_root),
    path('database/', admin.site.urls),   # built-in Django admin (kept from the original project)
    path('api/', include('backend.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
