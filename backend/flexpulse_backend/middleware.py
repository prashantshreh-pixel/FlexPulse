import os
from django.core.cache import cache
from django.http import HttpResponse


class SecurityHeadersMiddleware:
    """Attach defensive HTTP security headers to every response."""

    def __init__(self, get_response):
        self.get_response = get_response
        admin_slug = os.environ.get('DJANGO_ADMIN_URL', 'admin/').strip('/')
        self.admin_prefix = f'/{admin_slug}/' if admin_slug else '/admin/'

    def __call__(self, request):
        response = self.get_response(request)

        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=()'
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        response['X-Permitted-Cross-Domain-Policies'] = 'none'

        if 'Content-Security-Policy' not in response:
            is_admin = request.path.startswith(self.admin_prefix)
            script_src = "'self' 'unsafe-inline'" if is_admin else "'self'"
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                f"script-src {script_src}; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none';"
            )

        return response


class AdminRateLimitMiddleware:
    """Rate-limit POST attempts on the Django admin routes to prevent brute force."""

    MAX_ATTEMPTS = 10
    WINDOW_SECONDS = 60

    def __init__(self, get_response):
        self.get_response = get_response
        admin_slug = os.environ.get('DJANGO_ADMIN_URL', 'admin/').strip('/')
        self.admin_prefix = f'/{admin_slug}/' if admin_slug else '/admin/'

    def __call__(self, request):
        if request.method == 'POST' and request.path.startswith(self.admin_prefix):
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')
            cache_key = f'admin_rl:{client_ip}'
            attempts = cache.get(cache_key, 0)
            if attempts >= self.MAX_ATTEMPTS:
                return HttpResponse(
                    'Too many login attempts. Please wait 60 seconds and try again.',
                    status=429,
                    content_type='text/plain',
                )
            if attempts == 0:
                cache.set(cache_key, 1, self.WINDOW_SECONDS)
            else:
                try:
                    cache.incr(cache_key)
                except ValueError:
                    cache.set(cache_key, attempts + 1, self.WINDOW_SECONDS)

        return self.get_response(request)
