#!/usr/bin/env python3
"""Build a small public jobs feed from Teletalk's official Alljobs portal."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

SOURCE = "https://alljobs.teletalk.com.bd/bn/"
OUT = Path("jobs-feed.json")
HEADERS = {"User-Agent": "RubelTelecomJobsFeed/1.0 (public government-job link index)"}

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def main():
    response = requests.get(SOURCE, headers=HEADERS, timeout=35)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    records = []
    seen = set()

    for a in soup.find_all("a", href=True):
        label = clean(a.get_text(" ", strip=True)).lower()
        href = urljoin(SOURCE, a["href"])
        parsed = urlparse(href)
        if not any(x in label for x in ("see openings", "view openings", "openings")):
            continue
        if parsed.scheme != "https" or not parsed.netloc.endswith("teletalk.com.bd"):
            continue

        container = a
        best_text = clean(a.parent.get_text(" ", strip=True)) if a.parent else ""
        for _ in range(5):
            if container.parent is None:
                break
            container = container.parent
            candidate = clean(container.get_text(" ", strip=True))
            if candidate and len(candidate) <= 700:
                best_text = candidate
                if container.find(["h2", "h3", "h4", "h5", "strong"]):
                    break

        heading = None
        for node in container.find_all(["h2", "h3", "h4", "h5", "strong"], limit=8):
            candidate = clean(node.get_text(" ", strip=True))
            if candidate and candidate.lower() not in ("see openings", "view openings"):
                heading = candidate
                break
        if not heading:
            heading = clean(a.parent.get_text(" ", strip=True)) if a.parent else ""
            heading = re.sub(r"(?i)see openings|view openings", "", heading).strip(" :-")
        if not heading or len(heading) < 3:
            continue

        count_match = re.search(r"(?:openings?)\s*:?\s*(\d+)", best_text, re.I)
        count = int(count_match.group(1)) if count_match else None
        key = (heading.casefold(), href)
        if key in seen:
            continue
        seen.add(key)
        records.append({
            "organization": heading[:180],
            "openings": count,
            "url": href,
            "source": SOURCE
        })

    if not records:
        raise SystemExit("No openings parsed from official Alljobs page; keeping existing feed unchanged.")
    records.sort(key=lambda item: item["organization"].casefold())
    payload = {
        "source": SOURCE,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "Organization/opening links from official Teletalk Alljobs. Check each linked official portal for exact post, eligibility, fees and deadline.",
        "jobs": records
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} official employer/opening links to {OUT}")

if __name__ == "__main__":
    main()
