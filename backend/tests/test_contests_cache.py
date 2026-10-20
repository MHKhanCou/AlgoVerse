"""Concurrency and cache-behaviour tests for the contests endpoints.

The routes call out to five judge sites. These tests replace every source
fetcher and the Redis helpers with in-memory fakes, so nothing touches the
network or a real cache.
"""

import json
import threading
import time
from datetime import datetime, timedelta, timezone

import pytest

from app.routes import contests as contests_module

SOURCES = ["codeforces", "atcoder", "leetcode", "codechef", "topcoder"]
FULL_TTL = 60 * 60
MAX_PARTIAL_TTL = 5 * 60

# Tracks how many fake fetchers are inside their sleep at once. Wall-clock
# assertions are flaky on a loaded CI runner; overlap is the property the
# endpoint actually promises.
_OVERLAP = {"now": 0, "max": 0}
_OVERLAP_LOCK = threading.Lock()


def _contest(name, site, hours_from_now=1, duration=7200):
    start = datetime.now(timezone.utc) + timedelta(hours=hours_from_now)
    return {
        "site": site,
        "name": name,
        "url": f"https://example.com/{name.lower().replace(' ', '-')}",
        "start_time": start.isoformat(),
        "duration": duration,
    }


def _fetcher(name, result, ok=True, delay=0.0):
    def fetch():
        if delay:
            with _OVERLAP_LOCK:
                _OVERLAP["now"] += 1
                _OVERLAP["max"] = max(_OVERLAP["max"], _OVERLAP["now"])
            try:
                time.sleep(delay)
            finally:
                with _OVERLAP_LOCK:
                    _OVERLAP["now"] -= 1
        contests_module.last_fetch_stats[name] = {"ok": ok, "count": len(result)}
        return list(result)

    return fetch


def _patch_sources(monkeypatch, config):
    """config: source name -> (result, ok, delay). AtCoder is covered on both
    the HTML and the kenkoooo fallback path."""

    with _OVERLAP_LOCK:
        _OVERLAP["now"] = 0
        _OVERLAP["max"] = 0

    def build(name):
        result, ok, delay = config.get(name, ([], False, 0.0))
        return _fetcher(name, result, ok, delay)

    monkeypatch.setattr(contests_module, "fetch_codeforces", build("codeforces"))
    monkeypatch.setattr(contests_module, "fetch_atcoder_html", build("atcoder"))
    monkeypatch.setattr(contests_module, "fetch_atcoder_kenkoooo", build("atcoder"))
    monkeypatch.setattr(contests_module, "fetch_leetcode_graphql", build("leetcode"))
    monkeypatch.setattr(contests_module, "fetch_codechef", build("codechef"))
    monkeypatch.setattr(contests_module, "fetch_topcoder", build("topcoder"))


@pytest.fixture
def fake_cache(monkeypatch):
    """In-memory stand-in for the Redis helpers, recording every write."""
    state = {"store": {}, "writes": []}

    def get_cache(key):
        value = state["store"].get(key)
        # Mimic the JSON round-trip of the real helper: callers get a copy.
        return json.loads(json.dumps(value)) if value is not None else None

    def set_cache(key, value, expiry=0):
        state["store"][key] = json.loads(json.dumps(value))
        state["writes"].append({"key": key, "value": value, "expiry": expiry})

    monkeypatch.setattr(contests_module, "get_cache", get_cache)
    monkeypatch.setattr(contests_module, "set_cache", set_cache)
    return state


def test_sources_are_fetched_concurrently(client, monkeypatch, fake_cache):
    delay = 0.35
    _patch_sources(
        monkeypatch,
        {
            "codeforces": ([_contest("CF Round 1000", "codeforces")], True, delay),
            "atcoder": ([_contest("ABC 999", "atcoder")], True, delay),
            "leetcode": ([], True, delay),
            "codechef": ([], True, delay),
            "topcoder": ([], True, delay),
        },
    )

    resp = client.get("/api/contests?days=7")

    assert resp.status_code == 200
    # Sequential fetches would never overlap. Wall-clock bounds are unreliable
    # on a loaded CI runner (a parallel frontend build stretched this request
    # past any sane threshold), so the overlap counter is the assertion.
    assert _OVERLAP["max"] >= 2, "sources were fetched one at a time"
    upcoming = [c["name"] for c in resp.json()["upcoming"]]
    assert "CF Round 1000" in upcoming
    assert "ABC 999" in upcoming


def test_fully_failed_fetch_is_not_cached(client, monkeypatch, fake_cache):
    _patch_sources(monkeypatch, {name: ([], False, 0.0) for name in SOURCES})

    resp = client.get("/api/contests?days=7")
    assert resp.status_code == 200
    body = resp.json()
    assert body["running"] == [] and body["upcoming"] == [] and body["recent"] == []
    assert fake_cache["writes"] == [], "a total upstream failure must not be cached"


def test_partial_failure_uses_short_cache_ttl(client, monkeypatch, fake_cache):
    _patch_sources(
        monkeypatch,
        {
            "codeforces": ([_contest("CF Round 1000", "codeforces")], True, 0.0),
            "atcoder": ([], False, 0.0),
            "leetcode": ([], False, 0.0),
            "codechef": ([], False, 0.0),
            "topcoder": ([], False, 0.0),
        },
    )

    resp = client.get("/api/contests?days=7")
    assert resp.status_code == 200
    assert len(fake_cache["writes"]) == 1
    assert fake_cache["writes"][0]["expiry"] <= MAX_PARTIAL_TTL


def test_full_success_uses_full_cache_ttl(client, monkeypatch, fake_cache):
    _patch_sources(monkeypatch, {name: ([], True, 0.0) for name in SOURCES})

    resp = client.get("/api/contests?days=7")
    assert resp.status_code == 200
    assert len(fake_cache["writes"]) == 1
    assert fake_cache["writes"][0]["expiry"] == FULL_TTL


def test_cache_hit_reports_cached_true(client, monkeypatch, fake_cache):
    key = "contest_cache:all:7:True:True:7"
    fake_cache["store"][key] = {
        "status": "success",
        "running": [],
        "upcoming": [_contest("Cached Contest", "codeforces", hours_from_now=2)],
        "recent": [],
        "fetched_at": "2026-01-01T00:00:00+00:00",
        "counts": {"total": 1},
        "cached": False,
    }
    _patch_sources(monkeypatch, {name: ([], False, 0.0) for name in SOURCES})

    resp = client.get("/api/contests?days=7")
    assert resp.status_code == 200
    assert resp.json()["cached"] is True
    assert resp.json()["upcoming"][0]["name"] == "Cached Contest"


def test_source_failure_is_not_cached(client, monkeypatch, fake_cache):
    monkeypatch.setattr(contests_module, "fetch_codeforces", _fetcher("codeforces", [], False))

    resp = client.get("/api/contests/codeforces?days=7")
    assert resp.status_code == 200
    assert resp.json()["upcoming"] == []
    assert fake_cache["writes"] == [], "a failed source fetch must not be cached"


def test_source_cache_hit_reports_cached_true(client, monkeypatch, fake_cache):
    key = "contest_cache:codeforces:7:True"
    fake_cache["store"][key] = {
        "status": "success",
        "source": "codeforces",
        "running": [],
        "upcoming": [],
        "fetched_at": "2026-01-01T00:00:00+00:00",
        "count": 0,
        "cached": False,
    }

    resp = client.get("/api/contests/codeforces?days=7")
    assert resp.status_code == 200
    assert resp.json()["cached"] is True
