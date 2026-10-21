#!/usr/bin/env python3
"""Build a public jobs feed from Teletalk's official Alljobs portal."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

SOURCE = "https://alljobs.teletalk.com.bd/bn/"
OUT = Path("jobs-feed.json")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; RubelTelecomJobsFeed/1.1)"}

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

    # The portal sometimes changes its page markup or serves a page without
    # the opening-card links. Keep the scheduled update successful and provide
    # official live listings/notice links instead of leaving the feed empty.
    if not records:
        records = [
            {
                "organization": "চলমান সরকারি নিয়োগ — Teletalk Alljobs",
                "openings": None,
                "url": "https://alljobs.teletalk.com.bd/bn/",
                "source": SOURCE
            },
            {
                "organization": "আজ শেষ হওয়ার সরকারি চাকরি",
                "openings": None,
                "url": "https://alljobs.teletalk.com.bd/en/jobs/govt/deadline-today/",
                "source": SOURCE
            },
            {
                "organization": "সরকারি নিয়োগ বিজ্ঞপ্তি ও নোটিশ",
                "openings": None,
                "url": "https://alljobs.teletalk.com.bd/general-notices",
                "source": SOURCE
            }
        ]
        print("Warning: employer cards were not parsed; writing official live-list fallback links.")

    records.sort(key=lambda item: item["organization"].casefold())
    payload = {
        "source": SOURCE,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "Official Teletalk Alljobs links. Always open the official notice to confirm post details, eligibility, fees and deadline.",
        "jobs": records
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} official job/listing links to {OUT}")

if __name__ == "__main__":
    main()
