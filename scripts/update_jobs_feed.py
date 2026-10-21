#!/usr/bin/env python3
"""Build the public government jobs feed using Teletalk Alljobs' published-jobs API."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

SOURCE = "https://alljobs.teletalk.com.bd/bn/"
API = "https://alljobs.teletalk.com.bd/api/v1/published-jobs/search"
OUT = Path("jobs-feed.json")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; RubelTelecomJobsFeed/3.0)"}
SEARCH_TERMS = ["a", "e", "i", "o", "u", "ক", "স", "ম", "প", "অ", "শ", "অফিস", "সহকারী"]

def clean(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()

def fetch_api_jobs():
    session = requests.Session()
    session.headers.update(HEADERS)
    collected = {}
    now = datetime.now(timezone.utc)
    for term in SEARCH_TERMS:
        try:
            response = session.get(API, params={"searchKeyword": term}, timeout=25)
            response.raise_for_status()
            payload = response.json()
            jobs = payload.get("govtJobs", []) if isinstance(payload, dict) else []
            for job in jobs if isinstance(jobs, list) else []:
                if not isinstance(job, dict):
                    continue
                job_id = str(job.get("job_primary_id") or job.get("id") or "").strip()
                title = clean(job.get("job_title_bn") or job.get("job_title"))
                organization = clean(job.get("org_name_bn") or job.get("org_name"))
                if not job_id or not (title or organization):
                    continue
                deadline = job.get("deadline_date")
                if deadline:
                    try:
                        deadline_dt = datetime.fromisoformat(str(deadline).replace("Z", "+00:00"))
                        if deadline_dt.tzinfo is None:
                            deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
                        if deadline_dt < now:
                            continue
                    except (ValueError, TypeError):
                        pass
                url = clean(job.get("application_site_url"))
                if not url:
                    url = f"https://alljobs.teletalk.com.bd/jobs/government/{job_id}"
                if not url.startswith("https://") or "teletalk.com.bd" not in urlparse(url).netloc:
                    url = f"https://alljobs.teletalk.com.bd/jobs/government/{job_id}"
                collected[job_id] = {
                    "organization": organization or title,
                    "title": title,
                    "openings": job.get("vacancy"),
                    "deadline": deadline,
                    "url": url,
                    "source": SOURCE,
                    "jobId": job_id
                }
        except Exception as exc:
            print(f"API query {term!r} failed: {exc}")
    return sorted(collected.values(), key=lambda item: (str(item.get("deadline") or "9999"), item["organization"].casefold()))

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
        heading, card_text, node = "", "", a
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
            continue
        count_match = re.search(r"(?:openings?)\s*:?\s*(\d+)", card_text, re.I)
        count = int(count_match.group(1)) if count_match else None
        key = (heading.casefold(), href)
        if key not in seen:
            seen.add(key)
            records.append({"organization": heading[:180], "openings": count, "url": href, "source": SOURCE})
    return records

def main():
    # The official API is more reliable than scraping the JavaScript-rendered homepage.
    records = fetch_api_jobs()
    if records:
        print(f"Loaded {len(records)} active government jobs from the official Teletalk API.")
    else:
        print("The API returned no usable jobs; trying the official portal page.")
        response = requests.get(SOURCE, headers=HEADERS, timeout=35)
        response.raise_for_status()
        records = parse_page(response.text)
        if not records:
            try:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page(user_agent=HEADERS["User-Agent"])
                    page.goto(SOURCE, wait_until="networkidle", timeout=60000)
                    page.wait_for_timeout(2500)
                    records = parse_page(page.content())
                    browser.close()
            except Exception as exc:
                print(f"Browser-render fallback failed: {exc}")

    if not records:
        records = [
            {"organization": "চলমান সরকারি নিয়োগ — Teletalk Alljobs", "title": "", "openings": None,
             "url": SOURCE, "source": SOURCE},
            {"organization": "আজ শেষ হওয়ার সরকারি চাকরি", "title": "", "openings": None,
             "url": "https://alljobs.teletalk.com.bd/en/jobs/govt/deadline-today/", "source": SOURCE},
            {"organization": "সরকারি নিয়োগ বিজ্ঞপ্তি ও নোটিশ", "title": "", "openings": None,
             "url": "https://alljobs.teletalk.com.bd/general-notices", "source": SOURCE}
        ]
        print("Warning: writing official live-list fallback links.")
    payload = {
        "source": SOURCE,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "Active government jobs from the official Teletalk Alljobs API. Open the official listing to verify details, eligibility, fees and deadline.",
        "jobs": records
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} official job/listing links to {OUT}")

if __name__ == "__main__":
    main()
