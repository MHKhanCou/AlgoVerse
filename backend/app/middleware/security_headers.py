"""
Baseline security response headers.

The API returns JSON, not HTML, but a browser still applies its built-in
protections based on these headers - and the browsers that matter (any page
that talks to this origin) are not under our control. None of these headers
change the response body.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..core.config import settings

# Set unless the route already chose a value (`setdefault`), so a specific
# endpoint can override any of these without touching this file.
#
#   - nosniff      stops a browser re-reading a JSON error body as HTML/JS
#   - DENY         stops another site framing the API
#   - no-referrer  keeps resource ids out of third-party referer logs
#   - Permissions-Policy turns off device APIs the API never needs
#
# There is deliberately no Content-Security-Policy: /docs serves Swagger UI,
# which needs inline scripts and a CDN. A policy strict enough to be worth
# having has to be scoped per-route first, which is tracked in ROADMAP.md.
_BASE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

# Only sent in production: HSTS on a local http:// origin is ignored by
# browsers, and sending it from a dev server that happens to run over https
# would pin a developer's browser to https for that host.
_HSTS_HEADER = ("Strict-Transport-Security", "max-age=31536000; includeSubDomains")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for name, value in _BASE_HEADERS.items():
            response.headers.setdefault(name, value)
        if settings.is_production:
            response.headers.setdefault(*_HSTS_HEADER)
        return response
