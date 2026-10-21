#!/usr/bin/env python3
"""Build the public government jobs feed from Teletalk Alljobs."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

SOURCE = "https://alljobs.teletalk.com.bd/bn/"
OUT = Path("jobs-feed.json")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; RubelTelecomJobsFeed/2.0)"}

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def parse_page(html):
    soup = BeautifulSoup(html, "html.parser")
    records, seen = [], set()
    for a in soup.find_all("a", href=True):
        label = clean(a.get_text(" ", strip=True)).lower()
        if not any(x in label for x in ("see openings", "view openings", "openings")):
            continue
        href = urljoin(SOURCE, a["href"])
        parsed = urlparse(href)
        if parsed.scheme != "https" or not parsed.netloc.endswith("teletalk.com.bd"):
            continue

        heading, card_text = "", ""
        node = a
        # Pick the nearest reasonably-sized card that contains an organization heading.
        for _ in range(8):
            if node.parent is None:
                break
            node = node.parent
            text = clean(node.get_text(" ", strip=True))
            headings = node.find_all(["h2", "h3", "h4", "h5"], limit=4)
            if headings and text and len(text) <= 1200:
                candidate = clean(headings[0].get_text(" ", strip=True))
                if candidate and candidate.lower() not in ("see openings", "view openings"):
                    heading, card_text = candidate, text
                    break

        if not heading:
            parent_text = clean(a.parent.get_text(" ", strip=True)) if a.parent else ""
            heading = re.sub(r"(?i)see openings|view openings", "", parent_text).strip(" :-")
            card_text = parent_text
        if len(heading) < 3:
            continue

        count_match = re.search(r"(?:openings?)\s*:?\s*(\d+)", card_text, re.I)
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
    records.sort(key=lambda item: item["organization"].casefold())
    return records

def main():
    html = ""
    response = requests.get(SOURCE, headers=HEADERS, timeout=35)
    response.raise_for_status()
    html = response.text
    records = parse_page(html)

    # Alljobs may render the organization cards with client-side JavaScript.
    # If the plain HTML has no cards, render it in Chromium and parse the DOM.
    if not records:
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent=HEADERS["User-Agent"])
                page.goto(SOURCE, wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(2500)
                html = page.content()
                browser.close()
            records = parse_page(html)
        except Exception as exc:
            print(f"Browser-render fallback failed: {exc}")

    # If Teletalk changes its page again, keep the feed usable with official live links.
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
        print("Warning: no employer cards were found; writing official live-list fallback links.")
    else:
        print(f"Parsed {len(records)} employer/job links from the official portal.")

    payload = {
        "source": SOURCE,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "Official Teletalk Alljobs links. Open each official listing/notice to confirm post details, eligibility, fees and deadline.",
        "jobs": records
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} official job/listing links to {OUT}")

if __name__ == "__main__":
    main()
