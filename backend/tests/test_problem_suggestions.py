"""Tests for practice-problem suggestions (/api/problems/suggest/{id}).

The feature must always suggest REAL problems: candidates come from the
Codeforces problemset API (mocked here — no network is touched) plus a curated
CSES list, and any AI output is validated against that pool, so a model cannot
fabricate problem links. Without an AI key the same pool is ranked
deterministically.
"""
import json
from types import SimpleNamespace

import pytest

from app import models
from app.services import problem_suggestions
from tests.conftest import TestSession


@pytest.fixture(autouse=True)
def _clean_suggestion_state():
    """Module-level caches must not leak between tests."""
    problem_suggestions.clear_caches()
    yield
    problem_suggestions.clear_caches()


def _fake_pool():
    """Deterministic stand-in for the Codeforces problemset."""
    rows = [
        ("101A", "Sort Them All", 900, ["sortings", "implementation"], 9000),
        ("102A", "Pivot Practice", 1000, ["sortings"], 8000),
        ("103A", "Partition Basics", 1100, ["sortings"], 7000),
        ("104A", "Merge Rain", 1200, ["sortings"], 6000),
        ("105A", "Divide Evenly", 1300, ["sortings"], 5000),
        ("106A", "Stable Order", 1400, ["sortings"], 4000),
        ("107A", "Search Half", 1200, ["binary search"], 6500),
        ("108A", "Two Pointers Away", 1300, ["binary search", "two pointers"], 5500),
        ("109A", "Graph Stroll", 1400, ["graphs"], 4500),
        ("110A", "Count the Ways", 1300, ["dp"], 3500),
    ]
    return [
        {
            "id": pid,
            "name": name,
            "rating": rating,
            "tags": tags,
            "solved": solved,
            "url": f"https://codeforces.com/problemset/problem/{pid[:-1]}/{pid[-1]}",
        }
        for pid, name, rating, tags, solved in rows
    ]


def _seed_algorithm_row(name="Quick Sort"):
    """Insert an AlgorithmType + Algorithm and return the algorithm id."""
    db = TestSession()
    algo_type = models.AlgorithmType(name=f"Type {name}", description="Test type")
    db.add(algo_type)
    db.commit()
    algorithm = models.Algorithm(
        name=name,
        description="Partition around a pivot, then sort each side.",
        difficulty=models.AlgoDifficulty.medium,
        complexity=models.AlgoComplexity.Onlogn,
        type_id=algo_type.id,
    )
    db.add(algorithm)
    db.commit()
    algorithm_id = algorithm.id
    db.close()
    return algorithm_id


def _install_fake_pool(monkeypatch):
    monkeypatch.setattr(
        problem_suggestions, "fetch_codeforces_pool", lambda force=False: _fake_pool()
    )


def _disable_ai(monkeypatch):
    monkeypatch.setattr(problem_suggestions.settings, "AI_API_KEY", "")


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def _ai_reply(picks, summary="A steady climb from warm-up to stretch."):
    content = json.dumps({"summary": summary, "picks": picks})
    return _FakeResponse({"choices": [{"message": {"content": content}}]})


def test_endpoint_suggests_real_problems_without_ai(client, monkeypatch):
    _install_fake_pool(monkeypatch)
    _disable_ai(monkeypatch)
    algo_id = _seed_algorithm_row("Quick Sort")

    response = client.get(f"/api/problems/suggest/{algo_id}")
    assert response.status_code == 200
    body = response.json()

    assert body["ai"] is False
    assert body["algorithm_name"] == "Quick Sort"
    assert body["level"] is None
    assert body["level_source"] == "default"
    assert body["cached"] is False

    problems = body["problems"]
    assert len(problems) == 5
    # Curated CSES classics first, then the most-solved Codeforces problems.
    assert [p["platform"] for p in problems[:2]] == ["CSES", "CSES"]

    pool_ids = {row["id"] for row in _fake_pool()}
    for problem in problems:
        if problem["platform"] == "CSES":
            assert problem["url"] == (
                f"https://cses.fi/problemset/task/{problem['problem_id']}"
            )
            assert problem["problem_id"] in problem_suggestions.CSES_TASKS
        else:
            assert problem["problem_id"] in pool_ids
            assert problem["rating"] is not None
            assert problem["url"] in {row["url"] for row in _fake_pool()}
    # Every link must be unique.
    assert len({p["url"] for p in problems}) == len(problems)

    # A second request is served from the cache.
    again = client.get(f"/api/problems/suggest/{algo_id}")
    assert again.status_code == 200
    assert again.json()["cached"] is True


def test_count_parameter_and_unknown_algorithm(client, monkeypatch):
    _install_fake_pool(monkeypatch)
    _disable_ai(monkeypatch)
    algo_id = _seed_algorithm_row("Quick Sort")

    response = client.get(f"/api/problems/suggest/{algo_id}", params={"count": 3})
    assert response.status_code == 200
    assert len(response.json()["problems"]) == 3

    missing = client.get("/api/problems/suggest/999999")
    assert missing.status_code == 404


def test_ai_picks_are_validated_against_the_pool(client, monkeypatch):
    _install_fake_pool(monkeypatch)
    monkeypatch.setattr(problem_suggestions.settings, "AI_API_KEY", "test-key")
    monkeypatch.setattr(problem_suggestions.settings, "AI_MODEL", "test-model")

    captured = {}

    def fake_post(url, **kwargs):
        captured["url"] = url
        captured["payload"] = kwargs.get("json")
        return _ai_reply(
            [
                {"id": "101A", "why": "A gentle warm-up on sorting basics."},
                {"id": "9999Z", "why": "This id is not in the candidate list."},
                {"id": "103A", "why": "Classic partition practice."},
                {"id": "105A", "why": "Stretch problem on divide-and-conquer."},
            ]
        )

    monkeypatch.setattr(problem_suggestions.requests, "post", fake_post)
    algo_id = _seed_algorithm_row("Quick Sort")

    body = client.get(f"/api/problems/suggest/{algo_id}").json()

    assert body["ai"] is True
    assert body["model"] == "test-model"
    assert body["summary"] == "A steady climb from warm-up to stretch."
    ids = [p["problem_id"] for p in body["problems"]]
    assert ids == ["101A", "103A", "105A"]  # 9999Z dropped by validation
    assert all(p["why"] for p in body["problems"])
    assert all(p["source"] == "ai" for p in body["problems"])

    # The model was asked to pick from the pool, not to invent links.
    assert captured["url"].endswith("/chat/completions")
    prompt = captured["payload"]["messages"][1]["content"]
    assert "101A" in prompt


def test_ai_output_with_too_few_valid_picks_falls_back(client, monkeypatch):
    _install_fake_pool(monkeypatch)
    monkeypatch.setattr(problem_suggestions.settings, "AI_API_KEY", "test-key")

    def fake_post(url, **kwargs):
        return _ai_reply(
            [
                {"id": "101A", "why": "Only one real pick."},
                {"id": "bogus", "why": "Invented id."},
            ]
        )

    monkeypatch.setattr(problem_suggestions.requests, "post", fake_post)
    algo_id = _seed_algorithm_row("Quick Sort")

    body = client.get(f"/api/problems/suggest/{algo_id}").json()
    assert body["ai"] is False
    assert body["problems"]
    assert all(problem["why"] is None for problem in body["problems"])


def test_ai_transport_error_falls_back(client, monkeypatch):
    _install_fake_pool(monkeypatch)
    monkeypatch.setattr(problem_suggestions.settings, "AI_API_KEY", "test-key")

    def exploding_post(url, **kwargs):
        raise OSError("provider unreachable")

    monkeypatch.setattr(problem_suggestions.requests, "post", exploding_post)
    algo_id = _seed_algorithm_row("Quick Sort")

    response = client.get(f"/api/problems/suggest/{algo_id}")
    assert response.status_code == 200
    assert response.json()["ai"] is False
    assert len(response.json()["problems"]) >= 3


def test_cses_only_when_codeforces_unavailable(client, monkeypatch):
    monkeypatch.setattr(
        problem_suggestions, "fetch_codeforces_pool", lambda force=False: []
    )
    _disable_ai(monkeypatch)
    algo_id = _seed_algorithm_row("Quick Sort")

    body = client.get(f"/api/problems/suggest/{algo_id}").json()
    assert body["problems"]
    assert all(problem["platform"] == "CSES" for problem in body["problems"])
    assert all(
        problem["problem_id"] in problem_suggestions.CSES_TASKS
        for problem in body["problems"]
    )


def test_level_inferred_from_linked_codeforces_handle(monkeypatch):
    _install_fake_pool(monkeypatch)
    _disable_ai(monkeypatch)
    monkeypatch.setattr(problem_suggestions, "fetch_user_rating", lambda handle: 1600)

    db = TestSession()
    algorithm = SimpleNamespace(id=7, name="Quick Sort")
    user = SimpleNamespace(codeforces_handle="alice")

    result = problem_suggestions.suggest_for_algorithm(
        db, algorithm, count=5, explicit_level=None, user=user, refresh=False
    )
    db.close()

    assert result["level"] == 1600
    assert result["level_source"] == "codeforces"
    assert result["band"] == {"min": 1300, "max": 1800}
    assert result["problems"]


def test_explicit_level_wins_over_handle(monkeypatch):
    _install_fake_pool(monkeypatch)
    _disable_ai(monkeypatch)
    monkeypatch.setattr(problem_suggestions, "fetch_user_rating", lambda handle: 1600)

    db = TestSession()
    algorithm = SimpleNamespace(id=8, name="Quick Sort")
    user = SimpleNamespace(codeforces_handle="alice")

    result = problem_suggestions.suggest_for_algorithm(
        db, algorithm, count=3, explicit_level=1000, user=user, refresh=False
    )
    db.close()

    assert result["level"] == 1000
    assert result["level_source"] == "request"
    assert result["band"] == {"min": 800, "max": 1200}


def test_parse_ai_picks_handles_code_fences():
    fenced = '```json\n{"picks": [{"id": "1A", "why": "x"}]}\n```'
    parsed = problem_suggestions._parse_ai_picks(fenced)
    assert parsed is not None
    assert parsed["picks"][0]["id"] == "1A"

    assert problem_suggestions._parse_ai_picks("no json here") is None
    assert problem_suggestions._parse_ai_picks("") is None
