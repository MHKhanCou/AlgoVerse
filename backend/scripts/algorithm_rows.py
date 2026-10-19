#!/usr/bin/env python3
"""
Create algorithm rows for canonical content entries missing from the database.

The content sync (algorithm_content.py) only UPDATEs existing rows, so a new
algorithm page needs its row first: name, description, difficulty, complexity
and type. This script reads the canonical content files, checks which entries
listed in ROWS below are missing from the algorithms table, and inserts them.

Safety rails, mirroring algorithm_content.py:
  - dry-run by default; --apply writes
  - SQLite targets work without extra flags; a non-SQLite target requires
    --allow-remote so production is never the accidental target
  - existing rows are never modified — only INSERTs for missing names
  - an unknown algorithm type is an error, not an auto-created type
  - a content entry with no ROWS metadata is reported, never guessed

Typical flow:
    python backend/scripts/algorithm_rows.py --allow-remote            # dry run
    python backend/scripts/algorithm_rows.py --allow-remote --apply    # create
    python backend/scripts/algorithm_content.py --allow-remote --check # verify
"""

import argparse
import sys
from pathlib import Path

# Executed as a script, this puts the sibling module on sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from algorithm_content import (  # noqa: E402
    CONTENT_DIR,
    REPO_ROOT,
    connect,
    load_content,
    mask_url,
    require_remote_permission,
    resolve_database_url,
)

# name -> (difficulty, complexity, type name)
# Values are the database's Enum member names: easy/medium/hard and
# O1/Ologn/On/Onlogn/On2/On3/O2n/Onfact.
ROWS: dict[str, tuple[str, str, str]] = {
    "Counting Sort": ("easy", "On", "Sorting"),
    "Shell Sort": ("medium", "Onlogn", "Sorting"),
    "BST Search": ("medium", "Ologn", "Tree"),
    "BST In-Order Traversal": ("easy", "On", "Tree"),
    "Bellman-Ford": ("hard", "On2", "Graph"),
    "Hash Table": ("easy", "O1", "Hashing"),
}


def fetch_existing_names(engine) -> set[str]:
    from sqlalchemy import text

    with engine.connect() as conn:
        return set(conn.execute(text("SELECT name FROM algorithms")).scalars())


def fetch_type_ids(engine) -> dict[str, int]:
    from sqlalchemy import text

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, name FROM algorithm_types")).mappings()
        return {row["name"]: row["id"] for row in rows}


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--apply", action="store_true", help="insert missing rows")
    parser.add_argument("--database-url", help="explicit SQLAlchemy database URL")
    parser.add_argument("--allow-remote", action="store_true", help="allow a non-SQLite target")
    args = parser.parse_args()

    url = resolve_database_url(args.database_url)
    require_remote_permission(url, args.allow_remote, dry_run=not args.apply)

    content_by_name = {entry["name"]: entry for entry in load_content()}

    print(f"target: {mask_url(url)}")
    print(f"content: {len(content_by_name)} algorithms from {CONTENT_DIR.relative_to(REPO_ROOT)}")

    engine = connect(url)
    existing = fetch_existing_names(engine)

    # A content entry the database lacks and ROWS does not cover would need a
    # difficulty/complexity/type decision — surface it instead of guessing.
    unregistered = sorted(set(content_by_name) - existing - set(ROWS))
    if unregistered:
        print(f"content entries missing from the database without a ROWS entry ({len(unregistered)}):")
        for name in unregistered:
            print(f"  - {name}")
        print("\nAdd each one to ROWS in this script (difficulty, complexity, type) before seeding.")
        return 1

    missing = [name for name in ROWS if name not in existing]
    if not missing:
        print(f"OK: all {len(ROWS)} planned rows already exist; nothing to do.")
        return 0

    missing_content = sorted(name for name in missing if name not in content_by_name)
    if missing_content:
        print(f"rows planned without a content entry: {missing_content}")
        print("Write the canonical content first; a row should not exist without it.")
        return 1

    types = fetch_type_ids(engine)
    unknown_types = sorted({ROWS[name][2] for name in missing} - set(types))
    if unknown_types:
        print(f"algorithm types missing from the database: {unknown_types}")
        print("Create the types first (this script will not invent them).")
        return 1

    if not args.apply:
        print(f"\n{len(missing)} row(s) would be created:")
        for name in missing:
            difficulty, complexity, type_name = ROWS[name]
            print(f"  + {name}  [{type_name}, {difficulty}, {complexity}]")
        print("\nDry run — pass --apply to insert.")
        return 0

    from sqlalchemy import text

    created = 0
    with engine.begin() as conn:
        # Re-check inside the transaction so a concurrent insert cannot collide.
        current = set(conn.execute(text("SELECT name FROM algorithms")).scalars())
        for name in missing:
            if name in current:
                continue
            difficulty, complexity, type_name = ROWS[name]
            entry = content_by_name[name]
            conn.execute(
                text(
                    "INSERT INTO algorithms "
                    "(name, description, explanation, difficulty, complexity, type_id, code) "
                    "VALUES (:name, :description, :explanation, :difficulty, :complexity, :type_id, NULL)"
                ),
                {
                    "name": name,
                    "description": entry["description"].strip(),
                    "explanation": entry["explanation"].strip(),
                    "difficulty": difficulty,
                    "complexity": complexity,
                    "type_id": types[type_name],
                },
            )
            created += 1

    print(f"Applied: {created} row(s) created, {len(missing) - created} already existed.")
    print("Run algorithm_content.py --check next to confirm the content matches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
