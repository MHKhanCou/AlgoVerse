from fastapi import APIRouter, Query
import requests
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from pathlib import Path

def _load_dotenv_into_environ():
    """Minimal .env loader: reads key=value lines and sets os.environ if unset."""
    try:
        # project root assumed one level up from this file's directory
        root = Path(__file__).resolve().parents[1]
        env_path = root / ".env"
        if not env_path.exists():
            return
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v
    except Exception:
        # Fail silently; env vars may already be set another way
        pass

_load_dotenv_into_environ()

router = APIRouter()

CODEFORCES_API = "https://codeforces.com/api/contest.list?gym=false"
CLIST_API_BASE = "https://clist.by/api/v2/contest/"
ATCODER_CONTESTS_URL = "https://kenkoooo.com/atcoder/resources/contests.json"
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
CODECHEF_LIST_URL = "https://www.codechef.com/api/list/contests/all"

# Lightweight in-memory fetch stats for debugging
last_fetch_stats: Dict[str, Dict[str, object]] = {
    "codeforces": {},
    "atcoder": {},
    "leetcode": {},
    "codechef": {},
    "clist": {},
}


def parse_iso(ts: str) -> datetime:
    # Handles both kontests (ISO with Z) and our own ISO strings
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def to_iso_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def filter_upcoming(contests: List[Dict], days: int):
    now = datetime.now(timezone.utc)
    end_limit = now + timedelta(days=days)
    out = []
    for c in contests:
        try:
            start = parse_iso(c.get("start_time"))
            if now <= start <= end_limit:
                out.append(c)
        except Exception:
            continue
    return out


def filter_running(contests: List[Dict]):
    now = datetime.now(timezone.utc)
    res = []
    for c in contests:
        try:
            start = parse_iso(c.get("start_time"))
            dur_seconds = float(c.get("duration", 0) or 0)
            end = start + timedelta(seconds=dur_seconds)
            if start <= now <= end:
                res.append(c)
        except Exception:
            continue
    return res


def fetch_codeforces() -> List[Dict]:
    """Fetch and normalize Codeforces contests from official API."""
    try:
        r = requests.get(CODEFORCES_API, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK":
            last_fetch_stats["codeforces"] = {"ok": False, "status": data.get("status"), "count": 0}
            return []
        contests = data.get("result", [])
        normalized = []
        for c in contests:
            phase = (c.get("phase") or "").upper()
            if phase not in ("BEFORE", "CODING"):
                continue
            start = datetime.fromtimestamp(c.get("startTimeSeconds", 0), tz=timezone.utc)
            duration = int(c.get("durationSeconds", 0) or 0)
            normalized.append({
                "site": "Codeforces",
                "name": c.get("name"),
                "url": f"https://codeforces.com/contest/{c.get('id')}",
                "start_time": to_iso_utc(start),
                "duration": duration,
            })
        last_fetch_stats["codeforces"] = {"ok": True, "count": len(normalized)}
        return normalized
    except Exception as e:
        last_fetch_stats["codeforces"] = {"ok": False, "error": str(e)}
        return []


def fetch_codechef() -> List[Dict]:
    """Fetch present and future CodeChef contests from their public API."""
    try:
        headers = {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "AlgoVerse/1.0 (+https://example.com)",
        }
        r = requests.get(CODECHEF_LIST_URL, headers=headers, timeout=12)
        r.raise_for_status()
        js = r.json() or {}
        items = (js.get("present_contests") or []) + (js.get("future_contests") or [])
        norm: List[Dict] = []
        for it in items:
            try:
                code = it.get("contest_code") or it.get("contestCode")
                name = it.get("contest_name") or it.get("contestName") or code
                start_iso = it.get("contest_start_date_iso") or it.get("contestStartDateISO")
                end_iso = it.get("contest_end_date_iso") or it.get("contestEndDateISO")
                if not (code and name and start_iso and end_iso):
                    continue
                # compute duration
                try:
                    sd = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
                    ed = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
                    duration = int((ed - sd).total_seconds())
                except Exception:
                    duration = 0
                norm.append({
                    "site": "CodeChef",
                    "name": name,
                    "url": f"https://www.codechef.com/{code}",
                    "start_time": start_iso,
                    "duration": duration,
                })
            except Exception:
                continue
        last_fetch_stats["codechef"] = {"ok": True, "count": len(norm)}
        return norm
    except Exception as e:
        last_fetch_stats["codechef"] = {"ok": False, "error": str(e)}
        return []


def fetch_atcoder_kenkoooo() -> List[Dict]:
    """Fetch upcoming AtCoder contests from kenkoooo dataset."""
    try:
        r = requests.get(ATCODER_CONTESTS_URL, timeout=12)
        r.raise_for_status()
        data = r.json()
        now_dt = datetime.now(timezone.utc)
        now_ts = now_dt.timestamp()
        limit_ts = (now_dt + timedelta(days=60)).timestamp()  # cap horizon to 60d for safety
        norm = []
        for c in data:
            try:
                start_epoch = c.get("start_epoch_second")
                duration = int(c.get("duration_second", 0))
                title = c.get("title")
                cid = c.get("id")
                if not start_epoch or not title:
                    continue
                se = float(start_epoch)
                if se < now_ts or se > limit_ts:
                    # only future within horizon
                    continue
                st = datetime.fromtimestamp(int(se), tz=timezone.utc)
                norm.append({
                    "site": "AtCoder",
                    "name": title,
                    "url": f"https://atcoder.jp/contests/{cid}",
                    "start_time": to_iso_utc(st),
                    "duration": duration,
                })
            except Exception:
                continue
        last_fetch_stats["atcoder"] = {"ok": True, "count": len(norm)}
        return norm
    except Exception as e:
        last_fetch_stats["atcoder"] = {"ok": False, "error": str(e)}
        return []


def fetch_leetcode_graphql() -> List[Dict]:
    """Fetch upcoming LeetCode contests via GraphQL."""
    try:
        payload = {
            "query": "{ activeContests { title titleSlug startTime duration } contestUpcomingContests { title titleSlug startTime duration } }"
        }
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "https://leetcode.com",
            "Referer": "https://leetcode.com/contest/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        r = requests.post(LEETCODE_GRAPHQL_URL, json=payload, headers=headers, timeout=12)
        r.raise_for_status()
        js = r.json()
        data = (js or {}).get("data") or {}
        contests = (data.get("contestUpcomingContests") or []) + (data.get("activeContests") or [])
        norm = []
        for c in contests:
            try:
                start_epoch = c.get("startTime")
                duration = int(c.get("duration") or 0)
                title = c.get("title")
                slug = c.get("titleSlug")
                if not start_epoch or not title or not slug:
                    continue
                st = datetime.fromtimestamp(int(start_epoch), tz=timezone.utc)
                norm.append({
                    "site": "LeetCode",
                    "name": title,
                    "url": f"https://leetcode.com/contest/{slug}",
                    "start_time": to_iso_utc(st),
                    "duration": duration,
                })
            except Exception:
                continue
        last_fetch_stats["leetcode"] = {"ok": True, "count": len(norm)}
        return norm
    except Exception as e:
        last_fetch_stats["leetcode"] = {"ok": False, "error": str(e)}
        return []


def fetch_clist(days: int, resources_override: List[str] | None = None) -> List[Dict]:
    """Fetch contests from CLIST if credentials are provided via environment:
    CLIST_USERNAME, CLIST_API_KEY. Returns normalized list or empty if unavailable.
    """
    username = os.getenv("CLIST_USERNAME")
    api_key = os.getenv("CLIST_API_KEY")
    if not username or not api_key:
        last_fetch_stats["clist"] = {"ok": False, "error": "missing_credentials"}
        return []
    try:
        now = datetime.now(timezone.utc)
        end_limit = now + timedelta(days=days)
        params = {
            "username": username,
            "api_key": api_key,
            "order_by": "start",
            "limit": 200,
            # Include running and upcoming contests in window
            "start__lte": end_limit.isoformat(),
            "end__gte": now.isoformat(),
        }
        if resources_override:
            params["resource__in"] = ",".join(resources_override)
        r = requests.get(CLIST_API_BASE, params=params, timeout=15)
        r.raise_for_status()
        js = r.json() or {}
        objects = js.get("objects") or []
        normalized: List[Dict] = []
        for obj in objects:
            try:
                start_raw = obj.get("start")
                end_raw = obj.get("end")
                if not start_raw:
                    continue
                # compute duration
                duration = obj.get("duration")
                if duration is None and end_raw:
                    try:
                        sd = datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                        ed = datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
                        duration = int((ed - sd).total_seconds())
                    except Exception:
                        duration = 0
                normalized.append({
                    "site": ((obj.get("resource") or {}).get("name")) or "Contest",
                    "name": obj.get("event"),
                    "url": obj.get("href"),
                    "start_time": start_raw,
                    "duration": int(float(duration or 0)),
                })
            except Exception:
                continue
        last_fetch_stats["clist"] = {"ok": True, "count": len(normalized)}
        return normalized
    except Exception as e:
        last_fetch_stats["clist"] = {"ok": False, "error": str(e)}
        return []


def fetch_kontests(platform: str) -> List[Dict]:
    url = KONTESTS_ENDPOINTS.get(platform)
    if not url:
        return []
    try:
        r = requests.get(url, timeout=8)
        r.raise_for_status()
        data = r.json()
        # Ensure normalized fields exist
        normalized = []
        for c in data:
            if not c.get("start_time"):
                continue
            normalized.append({
                "site": c.get("site") or platform.title(),
                "name": c.get("name"),
                "url": c.get("url"),
                "start_time": c.get("start_time"),
                "duration": c.get("duration", 0),
            })
        return normalized
    except Exception:
        return []


@router.get("/contests")
def get_contests(days: int = Query(7, ge=1), include_running: bool = True, resources: str | None = Query(None, description="Comma separated CLIST resources filter")):
    """
    Returns contests grouped into running and upcoming (within next N days).
    Sources:
    - Codeforces official API (robust even if kontests is down)
    - kontests.net for AtCoder, CodeChef, LeetCode (best-effort)
    """
    # Prefer CLIST if configured; otherwise fallback to Codeforces only
    res_list = None
    if resources:
        try:
            res_list = [r.strip() for r in resources.split(",") if r.strip()]
        except Exception:
            res_list = None
    clist_data = fetch_clist(days, res_list)
    clist_active = False
    resources_used = res_list or []
    if clist_data:
        merged = clist_data
        counts = {"clist": len(clist_data)}
        clist_active = True
    else:
        cf = fetch_codeforces()
        atc = fetch_atcoder_kenkoooo()
        lc = fetch_leetcode_graphql()
        cc = fetch_codechef()
        merged = cf + atc + lc + cc
        counts = {"total": len(merged), "cf": len(cf), "atcoder": len(atc), "leetcode": len(lc), "codechef": len(cc)}

    upcoming = filter_upcoming(merged, days)
    running = filter_running(merged) if include_running else []
    return {
        "status": "success",
        "running": running,
        "upcoming": upcoming,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
        "clist_active": clist_active,
        "resources_used": resources_used,
    }


@router.get("/contests/debug")
def contests_debug():
    """Return last fetch stats for each source to aid debugging."""
    return {"sources": last_fetch_stats}
