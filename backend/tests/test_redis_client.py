"""The shared Redis client must fail fast instead of stalling requests.

Without socket timeouts a hung or unreachable Redis makes every cache lookup
wait on the OS-level TCP timeout, which is what turned a slow cache into
minute-long contest page loads.
"""

from app.db import redis_client as redis_module


def test_redis_client_has_socket_timeouts():
    kwargs = redis_module.redis_client.connection_pool.connection_kwargs
    for option in ("socket_timeout", "socket_connect_timeout"):
        value = kwargs.get(option)
        assert value is not None, (
            f"{option} is not configured; an unreachable Redis would stall every request"
        )
        assert 0 < value <= 5, f"{option}={value} is too slow for a request-scoped cache"
