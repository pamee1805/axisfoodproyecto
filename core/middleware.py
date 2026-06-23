import re

from django.conf import settings
from django.http import HttpResponse


class DevelopmentCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if self._is_preflight(request):
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        origin = request.headers.get('Origin')
        if self._origin_allowed(origin):
            response['Access-Control-Allow-Origin'] = origin
            response['Vary'] = 'Origin'
            response['Access-Control-Allow-Methods'] = (
                'DELETE, GET, OPTIONS, PATCH, POST, PUT'
            )
            response['Access-Control-Allow-Headers'] = (
                'Authorization, Content-Type, X-CSRFToken'
            )

        return response

    def _is_preflight(self, request):
        return (
            request.method == 'OPTIONS'
            and 'Access-Control-Request-Method' in request.headers
        )

    def _origin_allowed(self, origin):
        if not origin:
            return False
        if origin in getattr(settings, 'CORS_ALLOWED_ORIGINS', []):
            return True
        return any(
            re.match(pattern, origin)
            for pattern in getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', [])
        )
