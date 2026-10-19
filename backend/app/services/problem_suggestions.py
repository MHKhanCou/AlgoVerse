"""Practice-problem suggestions for algorithm pages.

Design: suggestions are always REAL problems.

1. A candidate pool is built from verified sources:
   - the Codeforces problemset API (live, cached; no key required), and
   - a curated CSES list whose task ids and names were verified against
     https://cses.fi/problemset/ .
2. If an OpenAI-compatible LLM key is configured (AI_API_KEY), the model only
   *selects and explains* from that pool. Its output is validated against the
   candidate ids, so it cannot fabricate problem links.
3. Without a key, the same pool is ranked deterministically and the endpoint
   still returns useful suggestions.

Configure in backend/.env (any OpenAI-compatible endpoint works):
    AI_API_KEY=
    AI_BASE_URL=https://api.openai.com/v1
    AI_MODEL=gpt-4o-mini
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import Algorithm, User

logger = logging.getLogger(__name__)

CF_PROBLEMSET_URL = "https://codeforces.com/api/problemset.problems"
CF_USERINFO_URL = "https://codeforces.com/api/user.info"
CF_POOL_TTL = 24 * 3600
CF_USERINFO_TTL = 3600
SUGGESTION_TTL = 6 * 3600
DEFAULT_BAND = (800, 1400)

# Curated CSES tasks (id -> (title, tier)); ids verified against the live
# problem set listing so every link resolves.
CSES_TASKS: Dict[str, Tuple[str, str]] = {
    "1068": ("Weird Algorithm", "beginner"),
    "1083": ("Missing Number", "beginner"),
    "1094": ("Increasing Array", "beginner"),
    "1070": ("Permutations", "beginner"),
    "1072": ("Two Knights", "beginner"),
    "1092": ("Two Sets", "beginner"),
    "1618": ("Trailing Zeros", "beginner"),
    "1621": ("Distinct Numbers", "beginner"),
    "1084": ("Apartments", "beginner"),
    "1090": ("Ferris Wheel", "beginner"),
    "1622": ("Creating Strings", "beginner"),
    "1623": ("Apple Division", "beginner"),
    "1624": ("Chessboard and Queens", "beginner"),
    "2165": ("Tower of Hanoi", "beginner"),
    "1633": ("Dice Combinations", "beginner"),
    "1637": ("Removing Digits", "beginner"),
    "1646": ("Static Range Sum Queries", "beginner"),
    "1091": ("Concert Tickets", "easy"),
    "1619": ("Restaurant Customers", "easy"),
    "1629": ("Movie Festival", "easy"),
    "1640": ("Sum of Two Values", "easy"),
    "1643": ("Maximum Subarray Sum", "easy"),
    "1074": ("Stick Lengths", "easy"),
    "1631": ("Reading Books", "easy"),
    "1630": ("Tasks and Deadlines", "easy"),
    "1722": ("Fibonacci Numbers", "easy"),
    "1634": ("Minimizing Coins", "easy"),
    "1635": ("Coin Combinations I", "easy"),
    "1638": ("Grid Paths", "easy"),
    "1192": ("Counting Rooms", "easy"),
    "1193": ("Labyrinth", "easy"),
    "1667": ("Message Route", "easy"),
    "1668": ("Building Teams", "easy"),
    "1669": ("Round Trip", "easy"),
    "1679": ("Course Schedule", "easy"),
    "1753": ("String Matching", "easy"),
    "1732": ("Finding Borders", "easy"),
    "1733": ("Finding Periods", "easy"),
    "1674": ("Subordinates", "easy"),
    "1660": ("Subarray Sums I", "easy"),
    "1095": ("Exponentiation", "easy"),
    "1081": ("Common Divisors", "easy"),
    "1713": ("Counting Divisors", "easy"),
    "1079": ("Binomial Coefficients", "easy"),
    "1146": ("Counting Bits", "easy"),
    "2162": ("Josephus Problem I", "easy"),
    "2216": ("Collecting Numbers", "easy"),
    "1647": ("Static Range Minimum Queries", "easy"),
    "1648": ("Dynamic Range Sum Queries", "easy"),
    "1163": ("Traffic Lights", "medium"),
    "1661": ("Subarray Sums II", "medium"),
    "1662": ("Subarray Divisibility", "medium"),
    "1085": ("Array Division", "medium"),
    "1620": ("Factory Machines", "medium"),
    "1073": ("Towers", "medium"),
    "1645": ("Nearest Smaller Values", "medium"),
    "2217": ("Collecting Numbers II", "medium"),
    "3151": ("Bubble Sort Rounds I", "medium"),
    "3152": ("Bubble Sort Rounds II", "medium"),
    "1698": ("Swap Round Sorting", "medium"),
    "2163": ("Josephus Problem II", "medium"),
    "1164": ("Room Allocation", "medium"),
    "1194": ("Monsters", "medium"),
    "1671": ("Shortest Routes I", "medium"),
    "1673": ("High Score", "medium"),
    "1195": ("Flight Discount", "medium"),
    "1197": ("Cycle Finding", "medium"),
    "1675": ("Road Reparation", "medium"),
    "1676": ("Road Construction", "medium"),
    "1680": ("Longest Flight Route", "medium"),
    "1681": ("Game Routes", "medium"),
    "1702": ("Tree Traversals", "medium"),
    "1131": ("Tree Diameter", "medium"),
    "1076": ("Sliding Window Median", "medium"),
    "1077": ("Sliding Window Cost", "medium"),
    "1141": ("Playlist", "medium"),
    "2183": ("Missing Coin Sum", "medium"),
    "1636": ("Coin Combinations II", "medium"),
    "1158": ("Book Shop", "medium"),
    "1745": ("Money Sums", "medium"),
    "1093": ("Two Sets II", "medium"),
    "1639": ("Edit Distance", "medium"),
    "3403": ("Longest Common Subsequence", "medium"),
    "1746": ("Array Description", "medium"),
    "2413": ("Counting Towers", "medium"),
    "1744": ("Rectangle Cutting", "medium"),
    "1097": ("Removal Game", "medium"),
    "1145": ("Increasing Subsequence", "medium"),
    "1140": ("Projects", "medium"),
    "1653": ("Elevator Rides", "medium"),
    "1655": ("Maximum Xor Subarray", "medium"),
    "2136": ("Hamming Distance", "medium"),
    "1628": ("Meet in the Middle", "medium"),
    "1096": ("Throwing Dice", "medium"),
    "1143": ("Hotel Queries", "medium"),
    "1749": ("List Removals", "medium"),
    "1190": ("Subarray Sum Queries", "medium"),
    "1664": ("Movie Festival Queries", "hard"),
    "1734": ("Distinct Values Queries", "hard"),
    "1625": ("Grid Path Description", "hard"),
}

# Which real problems fit which algorithm. `cf_tags` must be Codeforces tag
# names (matched case-insensitively against the problemset API); `cses` are
# CSES task ids from the table above.
ALGORITHM_SOURCES: Dict[str, Dict[str, Any]] = {
    "Bubble Sort": {"cf_tags": ["sortings", "implementation"], "cses": ["1621", "1090", "1619"]},
    "Selection Sort": {"cf_tags": ["sortings", "implementation"], "cses": ["1621", "1074", "1619"]},
    "Insertion Sort": {"cf_tags": ["sortings", "implementation"], "cses": ["1621", "1090", "1631"]},
    "Merge Sort": {"cf_tags": ["sortings", "divide and conquer"], "cses": ["1084", "1621", "1630"]},
    "Quick Sort": {"cf_tags": ["sortings", "divide and conquer"], "cses": ["1084", "1074", "2183"]},
    "Heap Sort": {"cf_tags": ["sortings", "data structures"], "cses": ["1076", "1645", "1073"]},
    "Counting Sort": {"cf_tags": ["sortings"], "cses": ["1621", "1074", "2216"]},
    "Shell Sort": {"cf_tags": ["sortings"], "cses": ["1094", "2217", "1621"]},
    "Linear Search": {"cf_tags": ["implementation", "brute force"], "cses": ["1640", "1643", "1621"]},
    "Binary Search": {"cf_tags": ["binary search", "two pointers"], "cses": ["1085", "1620", "1621"]},
    "Jump Search": {"cf_tags": ["binary search"], "cses": ["1621", "1085"]},
    "Exponential Search": {"cf_tags": ["binary search"], "cses": ["1620", "1085"]},
    "Fibonacci": {"cf_tags": ["math"], "cses": ["1722", "1095"]},
    "Factorial": {"cf_tags": ["math"], "cses": ["1618", "1079"]},
    "Tower of Hanoi": {"cf_tags": ["divide and conquer", "math"], "cses": ["2165", "1622"]},
    "Recursion": {"cf_tags": ["brute force", "implementation"], "cses": ["1623", "1624", "1622"]},
    "Fibonacci DP": {"cf_tags": ["dp"], "cses": ["1633", "1634", "1637"]},
    "0/1 Knapsack": {"cf_tags": ["dp"], "cses": ["1158", "1745", "1093"]},
    "Coin Change": {"cf_tags": ["dp"], "cses": ["1634", "1635", "1636"]},
    "Longest Common Subsequence": {"cf_tags": ["dp", "strings"], "cses": ["1639", "3403"]},
    "Breadth-First Search": {"cf_tags": ["graphs", "shortest paths"], "cses": ["1192", "1667", "1194"]},
    "Depth-First Search": {"cf_tags": ["dfs and similar", "graphs"], "cses": ["1192", "1669", "1668"]},
    "Dijkstra's Algorithm": {"cf_tags": ["shortest paths", "graphs"], "cses": ["1671", "1195"]},
    "Bellman-Ford": {"cf_tags": ["shortest paths"], "cses": ["1673", "1197", "1195"]},
    "Prim's Algorithm": {"cf_tags": ["dsu", "graphs", "trees"], "cses": ["1675", "1676"]},
    "Kruskal's Algorithm": {"cf_tags": ["dsu", "graphs"], "cses": ["1675", "1676"]},
    "Topological Sort": {"cf_tags": ["graphs", "dfs and similar"], "cses": ["1679", "1680", "1681"]},
    "A* Search": {"cf_tags": ["shortest paths", "graphs"], "cses": ["1193", "1194"]},
    "KMP String Matching": {"cf_tags": ["strings", "hashing"], "cses": ["1753", "1732", "1733"]},
    "Rabin-Karp": {"cf_tags": ["hashing", "strings"], "cses": ["1753", "1732"]},
    "BST Insert": {"cf_tags": ["data structures", "trees"], "cses": ["1163", "1091", "1076"]},
    "BST Search": {"cf_tags": ["data structures", "trees"], "cses": ["1163", "1091"]},
    "BST In-Order Traversal": {"cf_tags": ["trees", "dfs and similar"], "cses": ["1674", "1702", "1131"]},
    "Heap Insert": {"cf_tags": ["data structures"], "cses": ["1076", "1645", "1143"]},
    "Hash Table": {"cf_tags": ["hashing", "data structures"], "cses": ["1640", "1662", "1643"]},
}

DEFAULT_SOURCES: Dict[str, Any] = {
    "cf_tags": ["implementation", "math"],
    "cses": ["1621", "1640", "1633"],
}

SYSTEM_PROMPT = (
    "You are a competitive programming coach for a learning platform. "
    "You receive an algorithm and a numbered list of REAL problems. "
    "Choose the problems that best build the algorithm's skill at the given "
    "level, ordered from warm-up to stretch. Only use ids from the list; "
    "never invent problems. Reply with JSON only, no code fences, in this "
    'shape: {"summary": "one short sentence about the set", '
    '"picks": [{"id": "<id from the list>", "why": "one sentence"}]}'
)

_cf_pool_cache: Dict[str, Any] = {"problems": None, "fetched_at": 0.0}
_user_rating_cache: Dict[str, Tuple[float, Optional[int]]] = {}
_suggestion_cache: Dict[Tuple[int, int, int, int], Dict[str, Any]] = {}


def fetch_codeforces_pool(force: bool = False) -> List[Dict[str, Any]]:
    """Fetch the Codeforces problemset once and keep it in memory.

    The API needs no key. On failure a stale copy is served when available;
    callers must also handle a totally empty pool.
    """
    now = time.time()
    cached = _cf_pool_cache["problems"]
    if cached is not None and not force and now - _cf_pool_cache["fetched_at"] < CF_POOL_TTL:
        return cached
    try:
        response = requests.get(CF_PROBLEMSET_URL, timeout=20)
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") != "OK":
            raise ValueError("Codeforces API returned non-OK status")
        result = payload["result"]
        solved_counts = {
            (stat.get("contestId"), stat.get("index")): stat.get("solvedCount", 0)
            for stat in result.get("problemStatistics", [])
        }
        problems: List[Dict[str, Any]] = []
        for problem in result.get("problems", []):
            contest_id, index = problem.get("contestId"), problem.get("index")
            rating = problem.get("rating")
            if contest_id is None or index is None or not rating:
                continue  # unrated problems are specials/experimental
            problems.append(
                {
                    "id": f"{contest_id}{index}",
                    "name": problem.get("name", ""),
                    "rating": int(rating),
                    "tags": [tag.lower() for tag in problem.get("tags", [])],
                    "solved": solved_counts.get((contest_id, index), 0),
                    "url": f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
                }
            )
        _cf_pool_cache["problems"] = problems
        _cf_pool_cache["fetched_at"] = now
        logger.info("Codeforces pool refreshed: %s problems", len(problems))
        return problems
    except Exception as exc:  # network, JSON, API errors — all non-fatal
        logger.warning("Codeforces problemset fetch failed: %s", exc)
        return cached if cached is not None else []


def fetch_user_rating(handle: str) -> Optional[int]:
    """Best-effort Codeforces rating for a handle (cached, never raises)."""
    handle = (handle or "").strip()
    if not handle:
        return None
    now = time.time()
    hit = _user_rating_cache.get(handle)
    if hit and now - hit[0] < CF_USERINFO_TTL:
        return hit[1]
    try:
        response = requests.get(CF_USERINFO_URL, params={"handles": handle}, timeout=10)
        response.raise_for_status()
        payload = response.json()
        rating = None
        if payload.get("status") == "OK" and payload.get("result"):
            rating = payload["result"][0].get("rating")
        _user_rating_cache[handle] = (now, rating)
        return rating
    except Exception as exc:
        logger.info("Codeforces user.info failed for %r: %s", handle, exc)
        return None


def level_band(level: Optional[int]) -> Tuple[int, int]:
    """Rating window around a level; a broad beginner window without one."""
    if level is None:
        return DEFAULT_BAND
    return max(800, level - 300), min(3500, level + 200)


def build_candidates(algorithm_name: str, band: Tuple[int, int]) -> List[Dict[str, Any]]:
    """Mixed pool: popular Codeforces problems in the band + CSES classics."""
    sources = ALGORITHM_SOURCES.get(algorithm_name, DEFAULT_SOURCES)
    tags = [tag.lower() for tag in sources.get("cf_tags", [])]
    low, high = band

    pool = fetch_codeforces_pool()
    tagged = [p for p in pool if any(tag in p["tags"] for tag in tags)]
    in_band = [p for p in tagged if low <= p["rating"] <= high]
    if len(in_band) < 12:
        # Niche tags or a high level: widen the window before giving up.
        # This is a union with the original band, so problems already in it
        # are never dropped.
        widen_low, widen_high = max(800, low - 400), high + 400
        in_band = [
            p for p in tagged
            if widen_low <= p["rating"] <= widen_high
        ]
    primary_tag = tags[0] if tags else None
    in_band.sort(
        key=lambda p: (
            0 if primary_tag and primary_tag in p["tags"] else 1,
            -p["solved"],
            p["rating"],
        )
    )
    candidates: List[Dict[str, Any]] = [
        {**problem, "source": "Codeforces"} for problem in in_band[:40]
    ]

    for task_id in sources.get("cses", []):
        task = CSES_TASKS.get(task_id)
        if not task:
            continue
        title, tier = task
        candidates.append(
            {
                "id": task_id,
                "name": title,
                "rating": None,
                "tier": tier,
                "tags": [],
                "solved": 0,
                "url": f"https://cses.fi/problemset/task/{task_id}",
                "source": "CSES",
            }
        )
    return candidates


def _cf_difficulty(rating: Optional[int]) -> str:
    if rating is None:
        return "easy"
    if rating < 1000:
        return "beginner"
    if rating < 1300:
        return "easy"
    if rating < 1600:
        return "medium"
    if rating < 2000:
        return "hard"
    return "expert"


def _parse_ai_picks(content: str) -> Optional[Dict[str, Any]]:
    """Extract the JSON object from a model reply (tolerates code fences)."""
    if not content:
        return None
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(content[start : end + 1])
    except (ValueError, TypeError):
        return None
    return parsed if isinstance(parsed, dict) else None


def _ai_select(
    candidates: List[Dict[str, Any]], algorithm_name: str, band: Tuple[int, int], count: int
) -> Optional[Dict[str, Any]]:
    """Ask the model to pick from the candidate pool. Returns None on any
    failure or when the reply does not validate — callers fall back."""
    api_key = (settings.AI_API_KEY or "").strip()
    if not api_key or not candidates:
        return None

    listing = [
        {
            "id": c["id"],
            "name": c["name"],
            "source": c["source"],
            "rating": c.get("rating"),
            "tags": c.get("tags", [])[:5],
        }
        for c in candidates
    ]
    user_prompt = (
        f"Algorithm: {algorithm_name}\n"
        f"Target level: Codeforces rating {band[0]}-{band[1]}\n"
        f"Pick exactly {count} problems.\n"
        f"Problems: {json.dumps(listing, ensure_ascii=False)}"
    )
    try:
        response = requests.post(
            settings.AI_BASE_URL.rstrip("/") + "/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.AI_MODEL,
                "temperature": 0.4,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=settings.AI_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.warning("AI problem selection failed: %s", exc)
        return None

    parsed = _parse_ai_picks(content)
    if not parsed:
        logger.warning("AI problem selection returned unparseable output")
        return None

    by_id = {c["id"]: c for c in candidates}
    picks: List[Dict[str, Any]] = []
    seen = set()
    for entry in parsed.get("picks", []):
        if not isinstance(entry, dict):
            continue
        problem_id = str(entry.get("id", "")).strip()
        if problem_id in by_id and problem_id not in seen:
            seen.add(problem_id)
            why = entry.get("why")
            picks.append(
                {
                    "problem": by_id[problem_id],
                    "why": why.strip()[:240] if isinstance(why, str) else None,
                }
            )
    if len(picks) < 3:
        logger.warning("AI problem selection validated %s picks; falling back", len(picks))
        return None

    summary = parsed.get("summary")
    return {
        "picks": picks,
        "summary": summary.strip()[:300] if isinstance(summary, str) else None,
        "model": settings.AI_MODEL,
    }


def _deterministic_select(
    candidates: List[Dict[str, Any]], count: int
) -> List[Dict[str, Any]]:
    """Source-balanced fallback: CSES classics first, then popular CF problems."""
    cses = [c for c in candidates if c["source"] == "CSES"]
    codeforces = [c for c in candidates if c["source"] == "Codeforces"]
    picked: List[Dict[str, Any]] = []
    for problem in cses[:2]:
        picked.append({"problem": problem, "why": None})
    for problem in codeforces:
        if len(picked) >= count:
            break
        picked.append({"problem": problem, "why": None})
    for problem in cses[2:]:
        if len(picked) >= count:
            break
        picked.append({"problem": problem, "why": None})
    return picked[:count]


def _serialize(
    problem: Dict[str, Any], algorithm_id: int, why: Optional[str], ai: bool
) -> Dict[str, Any]:
    is_cf = problem["source"] == "Codeforces"
    difficulty = _cf_difficulty(problem.get("rating")) if is_cf else problem.get("tier", "easy")
    if why:
        description = why
    elif is_cf:
        description = (
            f"Codeforces rating {problem['rating']} — "
            f"tagged {', '.join(problem.get('tags', [])[:3])}."
        )
    else:
        description = "A classic CSES problem that trains this topic."
    return {
        "id": f"{'cf' if is_cf else 'cses'}-{problem['id']}",
        "title": problem["name"],
        "name": problem["name"],
        "platform": problem["source"],
        "difficulty": difficulty,
        "url": problem["url"],
        "problem_url": problem["url"],
        "problem_id": problem["id"],
        "description": description,
        "tags": ", ".join(problem.get("tags", [])),
        "algorithm_id": algorithm_id,
        "source": "ai" if ai else "pool",
        "rating": problem.get("rating"),
        "why": why,
    }


def clear_caches() -> None:
    """Test/ops hook: drop every memoized fetch and suggestion."""
    _cf_pool_cache.update(problems=None, fetched_at=0.0)
    _user_rating_cache.clear()
    _suggestion_cache.clear()


def suggest_for_algorithm(
    db: Session,
    algorithm: Algorithm,
    *,
    count: int = 5,
    explicit_level: Optional[int] = None,
    user: Optional[User] = None,
    refresh: bool = False,
) -> Dict[str, Any]:
    """Build (or serve cached) suggestions for one algorithm."""
    level = explicit_level
    level_source = "request" if explicit_level is not None else "default"
    if level is None and user is not None and getattr(user, "codeforces_handle", None):
        rating = fetch_user_rating(user.codeforces_handle)
        if rating:
            level, level_source = rating, "codeforces"

    band = level_band(level)
    cache_key = (algorithm.id, band[0], band[1], count)
    now = time.time()
    hit = _suggestion_cache.get(cache_key)
    if hit and not refresh and now - hit["at"] < SUGGESTION_TTL:
        data, cached = hit["data"], True
    else:
        candidates = build_candidates(algorithm.name, band)
        ai_result = _ai_select(candidates, algorithm.name, band, count)
        if ai_result:
            selected, ai_used, summary, model = (
                ai_result["picks"],
                True,
                ai_result["summary"],
                ai_result["model"],
            )
        else:
            selected, ai_used, summary, model = (
                _deterministic_select(candidates, count),
                False,
                None,
                None,
            )
        data = {
            "problems": [
                _serialize(pick["problem"], algorithm.id, pick["why"], ai_used)
                for pick in selected
            ],
            "ai": ai_used,
            "summary": summary,
            "model": model,
            "available_candidates": len(candidates),
        }
        _suggestion_cache[cache_key] = {"data": data, "at": now}
        cached = False

    return {
        "algorithm_id": algorithm.id,
        "algorithm_name": algorithm.name,
        "level": level,
        "level_source": level_source,
        "band": {"min": band[0], "max": band[1]},
        "cached": cached,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **data,
    }
