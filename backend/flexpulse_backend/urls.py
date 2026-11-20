"""
URL configuration for flexpulse_backend project.
"""
import os
from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import path, re_path, include
from django.views.static import serve
from django.conf import settings

admin_slug = os.environ.get('DJANGO_ADMIN_URL', 'admin/').strip('/')
admin_path = f'{admin_slug}/' if admin_slug else 'admin/'

urlpatterns = [
    path(admin_path, admin.site.urls),
    path('api/', include('api.urls')),
    path('favicon.svg', serve, {
        'document_root': os.path.join(settings.BASE_DIR, '../dist'),
        'path': 'favicon.svg',
    }),
    path('assets/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, '../dist/assets'),
    }),
    path('images/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, '../dist/images'),
    }),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
