from fastapi import APIRouter, Query, Depends
import requests
import os
import re
import json
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from pathlib import Path
from ..db.redis_client import get_redis, set_cache, get_cache, delete_cache
from redis import Redis

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
    "hackerearth": {},
}


def parse_iso(ts: str) -> datetime:
    # Handles both kontests (ISO with Z) and our own ISO strings
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def to_iso_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def filter_recent(contests: List[Dict], days: int = 7):
    now = datetime.now(timezone.utc)
    start_limit = now - timedelta(days=days)
    out = []
    for c in contests:
        try:
            start = parse_iso(c.get("start_time"))
            dur_seconds = float(c.get("duration", 0) or 0)
            end = start + timedelta(seconds=dur_seconds)
            if start_limit <= end <= now:
                out.append(c)
        except Exception:
            continue
    return sorted(out, key=lambda x: parse_iso(x.get("start_time")), reverse=True)

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


def fetch_hackerearth() -> List[Dict]:
    """Scrape HackerEarth challenges page (Next.js) by reading __NEXT_DATA__ JSON and extracting ongoing/upcoming contests.

    More robust scanning logic to accommodate structure changes:
    - Expands paths checked
    - Parses timestamps in epoch seconds, epoch millis, or ISO formats
    - Accepts multiple possible keys for title/url/start/end
    """
    base = "https://www.hackerearth.com"
    paths = [
        "/challenges/",
        "/challenges/competitive/",
        "/challenges/hiring/",
        "/challenges/hackathon/",
    ]
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        data = None
        used_path = None
        for p in paths:
            try:
                r = requests.get(base + p, timeout=12, headers=headers)
                if r.status_code != 200:
                    # Some sub-paths may be 404/redirect in some regions; try next
                    continue
                soup = BeautifulSoup(r.text, "lxml")
                script = soup.find("script", id="__NEXT_DATA__")
                if script and script.string:
                    try:
                        data = json.loads(script.string)
                        used_path = p
                        break
                    except Exception:
                        continue
            except Exception:
                # network or parsing error on this path; try next
                continue
        if data is None:
            # Fallback 1: attempt to parse any JSON-LD scripts on the challenges pages
            try:
                # Try main challenges page explicitly
                r = requests.get(base + "/challenges/", timeout=12, headers=headers)
                if r.status_code == 200:
                    soup2 = BeautifulSoup(r.text, "lxml")
                    json_nodes = soup2.find_all("script", attrs={"type": "application/ld+json"})
                    ld_objs = []
                    for node in json_nodes:
                        try:
                            txt = node.string or node.get_text() or ""
                            if not txt.strip():
                                continue
                            parsed = json.loads(txt)
                            ld_objs.append(parsed)
                        except Exception:
                            continue
                    if ld_objs:
                        data = {"ld+json": ld_objs}
                        used_path = "/challenges/ (ld+json)"
            except Exception:
                pass

        if data is None:
            # Fallback 2: chrome extension JSON endpoint
            try:
                r = requests.get(base + "/chrome-extension/events/", timeout=12, headers=headers)
                r.raise_for_status()
                data = r.json()
                used_path = "/chrome-extension/events/"
            except Exception:
                last_fetch_stats["hackerearth"] = {"ok": False, "error": "next_data_missing"}
                return []

        # Heuristic: recursively scan for items with title/url and start/end timestamps
        norm: List[Dict] = []

        def parse_dt(any_ts) -> Optional[datetime]:
            """Parse a timestamp that may be epoch seconds, epoch millis, or ISO string."""
            if any_ts is None:
                return None
            try:
                # numeric or numeric string
                if isinstance(any_ts, (int, float)) or (isinstance(any_ts, str) and any_ts.strip().isdigit()):
                    val = int(float(any_ts))
                    # Heuristic: millis vs seconds
                    if val > 10**12:  # definitely millis
                        val = val // 1000
                    elif val > 10**10:  # likely millis
                        val = val // 1000
                    return datetime.fromtimestamp(val, tz=timezone.utc)
                # try ISO
                s = str(any_ts).strip().replace("Z", "+00:00")
                return datetime.fromisoformat(s)
            except Exception:
                return None

        def ensure_full_url(url_path: str) -> str:
            if not url_path:
                return ""
            if url_path.startswith("http"):
                return url_path
            if not url_path.startswith("/"):
                url_path = "/" + url_path
            return f"{base}{url_path}"

        def scan(obj):
            if isinstance(obj, dict):
                # common fields seen in HE data (try multiple alternatives)
                title = (
                    obj.get("title")
                    or obj.get("name")
                    or (obj.get("seo") or {}).get("title")
                    or (obj.get("challenge") or {}).get("title")
                )
                url_path = (
                    obj.get("url")
                    or obj.get("slug")
                    or obj.get("challenge_url")
                    or obj.get("public_url")
                    or obj.get("canonical_url")
                    or (obj.get("challenge") or {}).get("url")
                    or (obj.get("seo") or {}).get("url")
                )
                start_ts = (
                    obj.get("start_time")
                    or obj.get("start_ts")
                    or obj.get("start_timestamp")
                    or obj.get("start_datetime")
                    or obj.get("startDate")
                    or obj.get("start")
                    or obj.get("starts_at")
                    or obj.get("scheduled_at")
                    or (obj.get("schedule") or {}).get("start")
                )
                end_ts = (
                    obj.get("end_time")
                    or obj.get("end_ts")
                    or obj.get("end_timestamp")
                    or obj.get("end_datetime")
                    or obj.get("endDate")
                    or obj.get("end")
                    or obj.get("ends_at")
                    or (obj.get("schedule") or {}).get("end")
                )

                st = parse_dt(start_ts)
                ed = parse_dt(end_ts) if end_ts is not None else None

                if title and url_path and st:
                    try:
                        # compute duration
                        if ed and ed >= st:
                            duration = int((ed - st).total_seconds())
                        else:
                            # fallback: check "duration" field in minutes/hours/seconds
                            duration = 0
                            dur_val = obj.get("duration") or obj.get("duration_sec") or obj.get("duration_secs")
                            if dur_val:
                                try:
                                    duration = int(float(dur_val))
                                except Exception:
                                    pass
                            if duration == 0:
                                # If no end/duration, assume 2 hours to avoid zero-length
                                duration = 2 * 60 * 60

                        url_full = ensure_full_url(str(url_path))
                        norm.append({
                            "site": "HackerEarth",
                            "name": str(title),
                            "url": url_full,
                            "start_time": to_iso_utc(st),
                            "duration": duration,
                        })
                    except Exception:
                        pass
                for v in obj.values():
                    scan(v)
            elif isinstance(obj, list):
                for v in obj:
                    scan(v)

        scan(data)
        # de-duplicate by url
        seen = set()
        dedup = []
        for c in norm:
            u = c.get("url")
            if u in seen:
                continue
            seen.add(u)
            dedup.append(c)
        src = "html" if used_path and used_path.startswith("/challenges") else ("api" if used_path else "unknown")
        last_fetch_stats["hackerearth"] = {"ok": True, "count": len(dedup), "source": src, "path": used_path}
        return dedup
    except Exception as e:
        last_fetch_stats["hackerearth"] = {"ok": False, "error": str(e)}
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "en-US,en;q=0.9"
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        norm: List[Dict] = []
        now = datetime.now(timezone.utc)
        # Robust scan: any table rows with <time datetime> and a link to /contests/
        for table in soup.find_all("table"):
            body = table.find("tbody") or table
            for tr in body.find_all("tr"):
                tds = tr.find_all("td")
                if len(tds) < 2:
                    continue
                time_tag = tds[0].find("time")
                a = tds[1].find("a")
                if not (time_tag and a and a.get("href")):
                    # If <time> tag missing, try parsing text content (JST displayed on site)
                    if not (a and a.get("href")):
                        continue
                    href = a.get("href")
                    if "/contests/" not in href:
                        continue
                    raw = tds[0].get_text(" ", strip=True)
                    st = None
                    # Try several common formats
                    candidates = [
                        r"(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*\(JST\)",
                        r"(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*\+?0?9:?(?:00)?",
                        r"(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?",
                    ]
                    for pat in candidates:
                        m = re.search(pat, raw)
                        if not m:
                            continue
                        y, mo, d, hh, mm = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))
                        ss = int(m.group(6)) if m.lastindex and m.lastindex >= 6 and m.group(6) else 0
                        # Assume JST if no offset given
                        tz = timezone(timedelta(hours=9))
                        st = datetime(y, mo, d, hh, mm, ss, tzinfo=tz)
                        break
                    if not st:
                        continue
                    duration = 0
                    if len(tds) >= 3:
                        duration = _parse_duration_hhmm(tds[2].get_text(strip=True))
                    norm.append({
                        "site": "AtCoder",
                        "name": a.get_text(strip=True),
                        "url": f"https://atcoder.jp{href}" if href.startswith("/") else href,
                        "start_time": to_iso_utc(st),
                        "duration": duration,
                    })
                    continue
                href = a.get("href")
                if "/contests/" not in href:
                    continue
                start_iso = time_tag.get("datetime")
                if not start_iso:
                    # Try text fallback even if <time> exists without datetime
                    raw = tds[0].get_text(" ", strip=True)
                    try:
                        m = re.search(r"(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?", raw)
                        if m:
                            y, mo, d, hh, mm = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))
                            ss = int(m.group(6)) if m.lastindex and m.lastindex >= 6 and m.group(6) else 0
                            st = datetime(y, mo, d, hh, mm, ss, tzinfo=timezone(timedelta(hours=9)))
                        else:
                            continue
                    except Exception:
                        continue
                else:
                    try:
                        st = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
                    except Exception:
                        # If ISO parsing fails, skip
                        continue
                # Only consider now->future; also allow running
                # Duration from 3rd td if present in HH:MM
                duration = 0
                if len(tds) >= 3:
                    duration = _parse_duration_hhmm(tds[2].get_text(strip=True))
                norm.append({
                    "site": "AtCoder",
                    "name": a.get_text(strip=True),
                    "url": f"https://atcoder.jp{href}" if href.startswith("/") else href,
                    "start_time": to_iso_utc(st),
                    "duration": duration,
                })
        # Fallback to kenkoooo if HTML yields zero
        if not norm:
            ken = fetch_atcoder_kenkoooo()
            last_fetch_stats["atcoder"] = {"ok": True, "count": len(ken), "source": "kenkoooo_html_zero"}
            return ken
        last_fetch_stats["atcoder"] = {"ok": True, "count": len(norm), "source": "html"}
        return norm
    except Exception as e:
        last_fetch_stats["atcoder"] = {"ok": False, "error": str(e), "source": "html"}
        return []


def fetch_topcoder() -> List[Dict]:
    """Fetch Topcoder ACTIVE and UPCOMING challenges and normalize schedule."""
    try:
        norm: List[Dict] = []
        # First try with 'statuses' combined to avoid 400s
        params = {
            "statuses": "Active,Upcoming",
            "perPage": 100,
            "page": 1,
            "isLightweight": "true",
        }
        try:
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
        except Exception:
            # Ignore, will try fallback forms
            pass

        # If API returned empty, try HTML/Next.js fallback
        if not norm:
            html_norm = fetch_topcoder_html()
            if html_norm:
                last_fetch_stats["topcoder"] = {"ok": True, "count": len(html_norm), "source": "html"}
                return html_norm
        last_fetch_stats["topcoder"] = {"ok": True, "count": len(norm), "source": "api"}
        return norm
    except Exception as e:
        # On API failure, attempt HTML fallback
        html_norm = fetch_topcoder_html()
        if html_norm:
            last_fetch_stats["topcoder"] = {"ok": True, "count": len(html_norm), "source": "html", "api_error": str(e)}
            return html_norm
        last_fetch_stats["topcoder"] = {"ok": False, "error": str(e)}
        return []


def fetch_topcoder_html() -> List[Dict]:
    """Scrape Topcoder challenges page and extract Active/Upcoming from __NEXT_DATA__."""
    try:
        url = "https://www.topcoder.com/challenges?statuses=Active,Upcoming"
        r = requests.get(url, timeout=12, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        script = soup.find("script", id="__NEXT_DATA__")
        if not script or not script.string:
            return []
        data = json.loads(script.string)
        norm: List[Dict] = []

        def scan(obj):
            if isinstance(obj, dict):
                title = obj.get("name") or obj.get("title")
                cid = obj.get("id") or obj.get("challengeId")
                start = obj.get("startDate") or obj.get("startAt")
                end = obj.get("endDate") or obj.get("endAt") or obj.get("submissionEndDate")
                status = obj.get("status")
                if title and cid and start and end and (str(status).lower() in ("active", "upcoming")):
                    try:
                        st = datetime.fromisoformat(str(start).replace("Z", "+00:00"))
                        ed = datetime.fromisoformat(str(end).replace("Z", "+00:00"))
                        duration = max(0, int((ed - st).total_seconds()))
                        norm.append({
                            "site": "Topcoder",
                            "name": str(title),
                            "url": f"https://www.topcoder.com/challenges/{cid}",
                            "start_time": to_iso_utc(st),
                            "duration": duration,
                        })
                    except Exception:
                        pass
                for v in obj.values():
                    scan(v)
            elif isinstance(obj, list):
                for v in obj:
                    scan(v)

        scan(data)
        # Deduplicate by URL
        seen, out = set(), []
        for c in norm:
            u = c.get("url")
            if u in seen:
                continue
            seen.add(u)
            out.append(c)
        return out
    except Exception:
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
def get_contests(
    days: int = Query(7, ge=1), 
    include_running: bool = True,
    include_recent: bool = True,
    recent_days: int = Query(7, ge=1, le=30),
    refresh: bool = False,
    redis: Redis = Depends(get_redis)
):
    """
    Returns contests grouped into running, upcoming, and recent.
    Sources:
    - Codeforces official API (robust)
    - AtCoder contests dataset (kenkoooo)
    - LeetCode via GraphQL
    - CodeChef public API
    
    Args:
        days: Number of days to look ahead for upcoming contests
        include_running: Whether to include currently running contests
        include_recent: Whether to include recently finished contests
        recent_days: Number of past days to look for recent contests
        refresh: If True, bypass cache and fetch fresh data
        redis: Redis client instance
    """
    # Define cache keys for different sources
    cache_key = f"contest_cache:all:{days}:{include_running}:{include_recent}:{recent_days}"
    
    # Check if we have cached data and refresh flag is not set
    if not refresh:
        cached_data = get_cache(cache_key)
        if cached_data:
            return cached_data
    
    # If no cache or refresh requested, fetch from sources
    cf = fetch_codeforces()
    # Prefer HTML scraping for AtCoder for freshness
    atc = fetch_atcoder_html() or fetch_atcoder_kenkoooo()
    lc = fetch_leetcode_graphql()
    cc = fetch_codechef()
    tc = fetch_topcoder()
    # Skip HackerEarth for now in aggregation to avoid unnecessary requests
    merged = cf + atc + lc + cc + tc
    counts = {
        "total": len(merged),
        "cf": len(cf),
        "atcoder": len(atc),
        "leetcode": len(lc),
        "codechef": len(cc),
        "topcoder": len(tc),
    }

    upcoming = filter_upcoming(merged, days)
    running = filter_running(merged) if include_running else []
    recent = filter_recent(merged, recent_days) if include_recent else []
    
    # Prepare response data
    response_data = {
        "status": "success",
        "running": running,
        "upcoming": upcoming,
        "recent": recent,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
        "cached": False
    }
    
    # Cache the response data (expires in 1 hour)
    set_cache(cache_key, response_data, expiry=60*60)
    
    return response_data


@router.get("/contests/debug")
def contests_debug():
    """Return last fetch stats for each source to aid debugging."""
    return {"sources": last_fetch_stats}


@router.get("/contests/{source}")
def get_contests_by_source(
    source: str,
    days: int = Query(7, ge=1),
    include_running: bool = True,
    refresh: bool = False,
    redis: Redis = Depends(get_redis)
):
    """
    Returns contests from a specific source with Redis caching.
    
    Args:
        source: The contest source (codeforces, atcoder, leetcode, codechef, topcoder, hackerearth)
        days: Number of days to look ahead for upcoming contests
        include_running: Whether to include currently running contests
        refresh: If True, bypass cache and fetch fresh data
        redis: Redis client instance
    """
    source = source.lower()
    valid_sources = ["codeforces", "atcoder", "leetcode", "codechef", "topcoder", "hackerearth"]
    
    if source not in valid_sources:
        return {"status": "error", "message": f"Invalid source. Valid sources are: {', '.join(valid_sources)}"}
    
    # Define cache key for this source
    cache_key = f"contest_cache:{source}:{days}:{include_running}"
    
    # Check if we have cached data and refresh flag is not set
    if not refresh:
        cached_data = get_cache(cache_key)
        if cached_data:
            return cached_data
    
    # Fetch data based on source
    contests = []
    if source == "codeforces":
        contests = fetch_codeforces()
    elif source == "atcoder":
        contests = fetch_atcoder_html() or fetch_atcoder_kenkoooo()
    elif source == "leetcode":
        contests = fetch_leetcode_graphql()
    elif source == "codechef":
        contests = fetch_codechef()
    elif source == "topcoder":
        contests = fetch_topcoder()
    elif source == "hackerearth":
        contests = fetch_hackerearth()
    
    # Filter contests
    upcoming = filter_upcoming(contests, days)
    running = filter_running(contests) if include_running else []
    
    # Prepare response data
    response_data = {
        "status": "success",
        "source": source,
        "running": running,
        "upcoming": upcoming,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(contests),
        "cached": False
    }
    
    # Cache the response data (expires in 1 hour)
    set_cache(cache_key, response_data, expiry=60*60)
    
    return response_data
