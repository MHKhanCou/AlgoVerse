#!/usr/bin/env python3
"""Check or apply canonical algorithm content against the database.

Source of truth: frontend/src/content/algorithms/*.json
- description and explanation are pushed into the `algorithms` table.
- whenToUse and commonMistakes stay in the JSON and are read by the frontend.

Usage (from the repository root):
    python backend/scripts/algorithm_content.py                 # check only (read-only)
    python backend/scripts/algorithm_content.py --apply         # apply, needs a target
    python backend/scripts/algorithm_content.py --apply --database-url sqlite:///scratch.db
    python backend/scripts/algorithm_content.py --check --allow-remote

Safety:
- Without --database-url, the script reads DATABASE_URL from the environment or
  backend/.env, then DEV_DATABASE_URL, then falls back to backend/algoverse.db.
- A non-SQLite target is refused unless --allow-remote is passed. This is
  deliberate: backend/.env currently points at a production Neon database.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_DIR = REPO_ROOT / "frontend" / "src" / "content" / "algorithms"
BACKEND_DIR = REPO_ROOT / "backend"
DEFAULT_SQLITE = BACKEND_DIR / "algoverse.db"


def load_content() -> list[dict]:
    entries: list[dict] = []
    for path in sorted(CONTENT_DIR.glob("*.json")):
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, list):
            raise SystemExit(f"{path}: expected a JSON array")
        entries.extend(data)
    if not entries:
        raise SystemExit(f"no content files found in {CONTENT_DIR}")
    names = [entry["name"] for entry in entries]
    duplicates = sorted({name for name in names if names.count(name) > 1})
    if duplicates:
        raise SystemExit(f"duplicate algorithm names in content: {duplicates}")
    return entries


def read_env_file() -> dict[str, str]:
    values: dict[str, str] = {}
    env_path = BACKEND_DIR / ".env"
    if not env_path.exists():
        return values
    for line in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def resolve_database_url(explicit: str | None) -> str:
    if explicit:
        return explicit
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    env_file = read_env_file()
    for key in ("DATABASE_URL", "DEV_DATABASE_URL"):
        if env_file.get(key):
            return env_file[key]
    return "sqlite:///" + DEFAULT_SQLITE.as_posix()


def is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def mask_url(url: str) -> str:
    if is_sqlite(url):
        return url
    parts = urlsplit(url)
    host = parts.hostname or ""
    database = parts.path.lstrip("/")
    return urlunsplit((parts.scheme, host, database, "", ""))


def require_remote_permission(url: str, allow_remote: bool, dry_run: bool) -> None:
    if is_sqlite(url) or allow_remote:
        return
    mode = "read" if dry_run else "write"
    raise SystemExit(
        f"refusing to {mode} a non-SQLite database without --allow-remote\n"
        f"target: {mask_url(url)}\n"
        "pass --allow-remote if this is intentional."
    )


def connect(url: str):
    from sqlalchemy import create_engine

    if is_sqlite(url):
        return create_engine(url, future=True)
    connect_args = {} if "sslmode=" in url else {"sslmode": "require"}
    normalized = url.replace("postgresql+psycopg2://", "postgresql://")
    return create_engine(normalized, connect_args=connect_args, future=True)


def fetch_rows(engine) -> dict[str, dict]:
    from sqlalchemy import text

    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT name, description, explanation FROM algorithms ORDER BY name")
        ).mappings()
        return {row["name"]: dict(row) for row in rows}


def report_missing_content(rows: dict[str, dict], content_by_name: dict[str, dict]) -> bool:
    missing = sorted(set(rows) - set(content_by_name))
    if missing:
        print(f"database rows with no content entry ({len(missing)}):")
        for name in missing:
            print(f"  - {name}")
    return bool(missing)


def check(engine, entries: list[dict]) -> int:
    content_by_name = {entry["name"]: entry for entry in entries}
    rows = fetch_rows(engine)

    problems = 0
    not_in_db = sorted(set(content_by_name) - set(rows))
    if not_in_db:
        problems += len(not_in_db)
        print(f"content entries missing from the database ({len(not_in_db)}):")
        for name in not_in_db:
            print(f"  - {name}")

    if report_missing_content(rows, content_by_name):
        problems += 1

    drifted: list[str] = []
    empty: list[str] = []
    for name, entry in content_by_name.items():
        row = rows.get(name)
        if not row:
            continue
        if not (row.get("description") or "").strip() or not (row.get("explanation") or "").strip():
            empty.append(name)
        elif row["description"].strip() != entry["description"].strip() or row[
            "explanation"
        ].strip() != entry["explanation"].strip():
            drifted.append(name)

    if empty:
        problems += len(empty)
        print(f"database rows with empty description/explanation ({len(empty)}):")
        for name in empty:
            print(f"  - {name}")

    if drifted:
        problems += len(drifted)
        print(f"database rows that differ from the content files ({len(drifted)}):")
        for name in drifted:
            print(f"  - {name}")

    if problems:
        print(f"\n{problems} problem(s) found. Run with --apply to sync description/explanation.")
        return 1

    print(f"OK: {len(entries)} algorithms match the canonical content.")
    return 0


def apply(engine, entries: list[dict]) -> int:
    from sqlalchemy import text

    content_by_name = {entry["name"]: entry for entry in entries}
    rows = fetch_rows(engine)

    not_in_db = sorted(set(content_by_name) - set(rows))
    if not_in_db:
        print(f"content entries missing from the database ({len(not_in_db)}):")
        for name in not_in_db:
            print(f"  - {name}")
        print("\nNo changes applied: fix the names first (a rename is a content decision).")
        return 1

    report_missing_content(rows, content_by_name)

    updated = 0
    unchanged = 0
    with engine.begin() as conn:
        for name, entry in content_by_name.items():
            description = entry["description"].strip()
            explanation = entry["explanation"].strip()
            current = rows[name]
            if (
                (current.get("description") or "").strip() == description
                and (current.get("explanation") or "").strip() == explanation
            ):
                unchanged += 1
                continue
            conn.execute(
                text(
                    "UPDATE algorithms SET description = :description, explanation = :explanation "
                    "WHERE name = :name"
                ),
                {"description": description, "explanation": explanation, "name": name},
            )
            updated += 1

    print(
        f"Applied: {updated} updated, {unchanged} already current, "
        f"{len(entries)} content entries checked."
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write description/explanation to the database")
    parser.add_argument("--check", action="store_true", help="read-only verification (default)")
    parser.add_argument("--database-url", help="explicit SQLAlchemy database URL")
    parser.add_argument("--allow-remote", action="store_true", help="allow a non-SQLite target")
    args = parser.parse_args()

    entries = load_content()
    url = resolve_database_url(args.database_url)
    require_remote_permission(url, args.allow_remote, dry_run=not args.apply)

    print(f"target: {mask_url(url)}")
    print(f"content: {len(entries)} algorithms from {CONTENT_DIR.relative_to(REPO_ROOT)}")

    engine = connect(url)
    if args.apply:
        return apply(engine, entries)
    return check(engine, entries)


if __name__ == "__main__":
    sys.exit(main())
