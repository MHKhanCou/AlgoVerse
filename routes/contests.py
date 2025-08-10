from fastapi import APIRouter, Query
import requests
import os
import re
import json
from bs4 import BeautifulSoup
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
ATCODER_CONTESTS_URL = "https://kenkoooo.com/atcoder/resources/contests.json"
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
CODECHEF_LIST_URL = "https://www.codechef.com/api/list/contests/all"
TOPCODER_API = "https://api.topcoder.com/v5/challenges"

# Lightweight in-memory fetch stats for debugging
last_fetch_stats: Dict[str, Dict[str, object]] = {
    "codeforces": {},
    "atcoder": {},
    "leetcode": {},
    "codechef": {},
    "topcoder": {},
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


def _parse_duration_hhmm(hhmm: str) -> int:
    """Parse duration in format 'HH:MM' to seconds."""
    try:
        parts = (hhmm or "").strip().split(":")
        h = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 0
        m = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        return h * 3600 + m * 60
    except Exception:
        return 0


def fetch_atcoder_html() -> List[Dict]:
    """Scrape AtCoder contests page to get Active and Upcoming contests with start time and duration."""
    url = "https://atcoder.jp/contests/"
    try:
        r = requests.get(url, timeout=12, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        def extract_from(header_text: str) -> List[Dict]:
            out: List[Dict] = []
            h = soup.find(lambda tag: tag.name in ("h2", "h3") and header_text in tag.get_text())
            if not h:
                return out
            table = h.find_next("table")
            if not table:
                return out
            body = table.find("tbody") or table
            for tr in body.find_all("tr"):
                tds = tr.find_all("td")
                if len(tds) < 3:
                    continue
                # start time
                start_iso = None
                time_tag = tds[0].find("time")
                if time_tag and time_tag.has_attr("datetime"):
                    start_iso = time_tag["datetime"]
                # name and url
                a = tds[1].find("a")
                name = a.get_text(strip=True) if a else tds[1].get_text(strip=True)
                href = a.get("href") if a else None
                url2 = f"https://atcoder.jp{href}" if href and href.startswith("/") else href
                # duration
                dur_text = tds[2].get_text(strip=True)
                duration = _parse_duration_hhmm(dur_text)

                if not start_iso:
                    continue
                try:
                    st = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
                except Exception:
                    continue
                out.append({
                    "site": "AtCoder",
                    "name": name,
                    "url": url2,
                    "start_time": to_iso_utc(st),
                    "duration": duration,
                })
            return out

        active = extract_from("Active Contests")
        upcoming = extract_from("Upcoming Contests")
        norm = active + upcoming
        last_fetch_stats["atcoder"] = {"ok": True, "count": len(norm), "source": "html"}
        return norm
    except Exception as e:
        last_fetch_stats["atcoder"] = {"ok": False, "error": str(e), "source": "html"}
        return []


def fetch_topcoder() -> List[Dict]:
    """Fetch Topcoder ACTIVE and UPCOMING challenges and normalize schedule."""
    try:
        norm: List[Dict] = []
        # Topcoder API expects status values like 'Active' and 'Upcoming'
        for status in ("Active", "Upcoming"):
            params = {
                "status": status,
                "perPage": 100,
                "page": 1,
                "isLightweight": "true",
            }
            r = requests.get(TOPCODER_API, params=params, timeout=12)
            r.raise_for_status()
            arr = r.json() or []
            for it in arr:
                try:
                    name = it.get("name")
                    cid = it.get("id")
                    start_raw = it.get("startDate") or it.get("startAt")
                    end_raw = it.get("endDate") or it.get("submissionEndDate") or it.get("endAt")
                    if not (name and cid and start_raw and end_raw):
                        continue
                    try:
                        st = datetime.fromisoformat(str(start_raw).replace("Z", "+00:00"))
                        ed = datetime.fromisoformat(str(end_raw).replace("Z", "+00:00"))
                    except Exception:
                        continue
                    duration = max(0, int((ed - st).total_seconds()))
                    norm.append({
                        "site": "Topcoder",
                        "name": name,
                        "url": f"https://www.topcoder.com/challenges/{cid}",
                        "start_time": to_iso_utc(st),
                        "duration": duration,
                    })
                except Exception:
                    continue
        last_fetch_stats["topcoder"] = {"ok": True, "count": len(norm)}
        return norm
    except Exception as e:
        last_fetch_stats["topcoder"] = {"ok": False, "error": str(e)}
        return []
def fetch_leetcode_graphql() -> List[Dict]:
    """Fetch upcoming LeetCode contests via GraphQL with fallback query."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://leetcode.com",
        "Referer": "https://leetcode.com/contest/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    queries = [
        # Preferred: single list
        {"query": "query { allContests { title titleSlug startTime duration } }", "pluck": lambda d: (d.get("allContests") or [])},
        # Fallback: split lists
        {"query": "query { activeContests { title titleSlug startTime duration } contestUpcomingContests { title titleSlug startTime duration } }",
         "pluck": lambda d: (d.get("contestUpcomingContests") or []) + (d.get("activeContests") or [])},
    ]
    errors: List[str] = []
    for q in queries:
        try:
            r = requests.post(LEETCODE_GRAPHQL_URL, json={"query": q["query"]}, headers=headers, timeout=12)
            r.raise_for_status()
            js = r.json()
            data = (js or {}).get("data") or {}
            contests = q["pluck"](data)
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
            if norm:
                last_fetch_stats["leetcode"] = {"ok": True, "count": len(norm)}
                return norm
            # If empty, still mark ok but zero; we'll try next fallback
            errors.append("empty result")
        except Exception as e:
            errors.append(str(e))
            continue
    last_fetch_stats["leetcode"] = {"ok": False, "error": "; ".join(errors) or "unknown"}
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
def get_contests(days: int = Query(7, ge=1), include_running: bool = True):
    """
    Returns contests grouped into running and upcoming (within next N days).
    Sources:
    - Codeforces official API (robust)
    - AtCoder contests dataset (kenkoooo)
    - LeetCode via GraphQL
    - CodeChef public API
    """
    cf = fetch_codeforces()
    # Prefer HTML scraping for AtCoder for freshness
    atc = fetch_atcoder_html() or fetch_atcoder_kenkoooo()
    lc = fetch_leetcode_graphql()
    cc = fetch_codechef()
    tc = fetch_topcoder()
    merged = cf + atc + lc + cc + tc
    counts = {"total": len(merged), "cf": len(cf), "atcoder": len(atc), "leetcode": len(lc), "codechef": len(cc), "topcoder": len(tc)}

    upcoming = filter_upcoming(merged, days)
    running = filter_running(merged) if include_running else []
    return {
        "status": "success",
        "running": running,
        "upcoming": upcoming,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
    }


@router.get("/contests/debug")
def contests_debug():
    """Return last fetch stats for each source to aid debugging."""
    return {"sources": last_fetch_stats}
