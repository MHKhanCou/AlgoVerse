"""Shared slowapi limiter.

Counters live in process memory by default. Set RATE_LIMIT_STORAGE_URI (or
REDIS_URL) to a Redis URL in production so that every worker shares one
counter instead of multiplying the effective limit by the worker count.
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

from ..core.config import settings


def _resolve_storage_uri() -> str:
    """Pick the limiter backend without assuming a local Redis exists.

    An explicit setting wins, then a generic REDIS_URL, then memory. The
    REDIS_HOST defaults used by the contest cache are deliberately not reused:
    they point at localhost, and trying to reach that on every request in a
    deployment without Redis would turn a cache optimization into latency.
    """
    explicit = os.getenv("RATE_LIMIT_STORAGE_URI") or settings.RATE_LIMIT_STORAGE_URI
    if explicit:
        return explicit
    return os.getenv("REDIS_URL") or "memory://"


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_resolve_storage_uri(),
    # A limiter outage must not take the API down with it: if the shared
    # backend errors, requests are allowed through rather than 500ing.
    swallow_errors=True,
)
