from redis import Redis
import os
import json
from typing import Optional, Any, Dict

# Get Redis configuration from environment variables with defaults
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Default expiration time for cache entries (24 hours in seconds)
DEFAULT_EXPIRY = 60 * 60 * 24

# Create a Redis client instance
redis_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    password=REDIS_PASSWORD,
    decode_responses=True,  # Automatically decode responses to strings
)


def get_redis() -> Redis:
    """Return the Redis client instance."""
    return redis_client


def set_cache(key: str, value: Any, expiry: int = DEFAULT_EXPIRY) -> bool:
    """Store a value in Redis with the given key and expiration time.
    
    Args:
        key: The cache key
        value: The value to store (will be JSON serialized)
        expiry: Expiration time in seconds (default: 24 hours)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        serialized = json.dumps(value)
        return redis_client.setex(key, expiry, serialized)
    except Exception:
        return False


def get_cache(key: str) -> Optional[Any]:
    """Retrieve a value from Redis by key.
    
    Args:
        key: The cache key
        
    Returns:
        The deserialized value if found, None otherwise
    """
    try:
        data = redis_client.get(key)
        if data is None:
            return None
        return json.loads(data)
    except Exception:
        return None


def delete_cache(key: str) -> bool:
    """Delete a value from Redis by key.
    
    Args:
        key: The cache key
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        return bool(redis_client.delete(key))
    except Exception:
        return False


def get_cache_ttl(key: str) -> Optional[int]:
    """Get the remaining TTL (time to live) for a key.
    
    Args:
        key: The cache key
        
    Returns:
        int: Remaining time in seconds, or None if key doesn't exist
    """
    try:
        ttl = redis_client.ttl(key)
        return ttl if ttl > 0 else None
    except Exception:
        return None