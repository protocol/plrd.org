#!/usr/bin/env python3
"""Full-history, four-area OpenAlex staging/replay. No scheduler or publishing."""
import argparse
import csv
import datetime as dt
from decimal import Decimal, InvalidOperation
import fcntl
import hashlib
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
from pathlib import Path

try:
    from . import field_velocity_openalex as generator
except ImportError:  # Direct CLI execution from the repository root.
    import field_velocity_openalex as generator

FIELDS = {
    "digital-human-rights": (2005, "content addressing|peer-to-peer network|censorship resistance|decentralized storage"),
    "economies-governance": (2005, "mechanism design|public goods funding|quadratic funding|digital public infrastructure"),
    "ai-robotics": (2005, "decentralized training|federated learning|multi-agent coordination|embodied AI"),
    "neurotech": (2000, "brain-computer interface|connectome|neural implant|whole brain emulation"),
}
COLUMNS = ("year field_works all_works corpus_share_per_100k first_time_authors "
           "idea_vintage_median_years vintage_ci_lo vintage_ci_hi n_refs_sampled n_works_sampled reliable").split()
SAMPLE = ("works_per_year=80; max_refs_per_work=50; cluster=title_and_abstract.search; "
          "ci=cluster_bootstrap(resample=works,iters=500,seed=42); "
          "note=first_time_authors intentionally blank (needs per-author history)")
SOURCE = "OpenAlex (https://openalex.org, CC0)"
SHARED_LOCK = "/opt/data/automations/openalex-acquisition.lock"


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic_write(path, data):
    """Durable single-file replacement, never a partially written receipt/CSV."""
    path = Path(path)
    fd, temporary = tempfile.mkstemp(prefix=".openalex-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        with open_directory(path.parent) as directory:
            os.fsync(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


class open_directory:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.fd = os.open(self.path, os.O_RDONLY | os.O_DIRECTORY)
        return self.fd

    def __exit__(self, *args):
        os.close(self.fd)


def contract(year, smoke_year=None):
    return {"year": year, "cutoff": year - 2, "fields": FIELDS,
            "smoke_year": smoke_year,
            "sample": SAMPLE, "columns": COLUMNS,
            "generator_sha256": digest(Path(generator.__file__).read_bytes())}


def render(slug, rows, year, generated):
    start, query = FIELDS[slug]
    stream = io.StringIO(newline="")
    stream.write(f"# generated: {generated}\n# source: {SOURCE}\n# query: {query}\n"
                 f"# from_year: {start}\n# reliable_cutoff_year: {year - 2}\n# sample: {SAMPLE}\n")
    writer = csv.DictWriter(stream, fieldnames=COLUMNS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode()


def read_csv(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    meta = {}
    for line in lines:
        if line.startswith("#"):
            key, separator, value = line[2:].partition(": ")
            if not separator or key in meta:
                raise ValueError("Invalid or duplicate CSV provenance")
            meta[key] = value
    reader = csv.DictReader(line for line in lines if not line.startswith("#"))
    rows = list(reader)
    return meta, reader.fieldnames, rows


def validate_set(folder, current_year, smoke_year=None):
    """Fail closed on the entire contract, including intentional missingness."""
    folder = Path(folder)
    expected = {slug + ".csv" for slug in FIELDS}
    if {p.name for p in folder.iterdir()} != expected:
        raise ValueError("Expected exactly the four OpenAlex CSVs")
    validated = {}
    for slug, (start, query) in FIELDS.items():
        path = folder / (slug + ".csv")
        meta, columns, rows = read_csv(path)
        required = {"source": SOURCE, "query": query, "from_year": str(start),
                    "reliable_cutoff_year": str(current_year - 2), "sample": SAMPLE}
        if columns != COLUMNS or set(meta) != set(required) | {"generated"}:
            raise ValueError("Unexpected CSV schema or provenance fields")
        if any(meta.get(k) != v for k, v in required.items()):
            raise ValueError("Frozen OpenAlex provenance mismatch")
        try:
            timestamp = dt.datetime.fromisoformat(meta["generated"].replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                raise ValueError()
        except ValueError:
            raise ValueError("Invalid acquisition timestamp") from None
        years = [smoke_year] if smoke_year is not None else range(start, current_year + 1)
        if len(rows) != len(years):
            raise ValueError("Incomplete publication-year range")
        numeric = []
        for year, row in zip(years, rows):
            if set(row) != set(COLUMNS) or any(v is None for v in row.values()):
                raise ValueError("Invalid CSV row width")
            ints = {}
            for key in ("year", "field_works", "all_works", "n_refs_sampled", "n_works_sampled", "reliable"):
                if not re.fullmatch(r"0|[1-9][0-9]*", row[key]):
                    raise ValueError("Invalid integer count")
                ints[key] = int(row[key])
            fw, aw, nr, nw = (ints[k] for k in ("field_works", "all_works", "n_refs_sampled", "n_works_sampled"))
            if (ints["year"] != year or ints["reliable"] != int(year < current_year - 2)
                    or row["first_time_authors"] != "" or aw <= 0 or fw > aw
                    or nw > min(80, fw) or nr < nw or nr > nw * 50):
                raise ValueError("Invalid chronology, reliability, or sample counts")
            try:
                share = float(row["corpus_share_per_100k"])
                stats = [None if row[k] == "" else float(row[k]) for k in COLUMNS[5:8]]
            except ValueError:
                raise ValueError("Invalid numeric reading") from None
            if not math.isfinite(share) or share != round(fw / aw * 1e5, 3):
                raise ValueError("Corpus share disagrees with counts")
            median, lo, hi = stats
            if any(v is not None and (not math.isfinite(v) or not 0 <= v <= year - 1900) for v in stats):
                raise ValueError("Invalid finite reference age")
            if ((median is None) != (nr == 0) or (nw == 0) != (nr == 0)
                    or (lo is None) != (nw < 8) or (hi is None) != (nw < 8)):
                raise ValueError("Unexpected missing median or confidence bounds")
            if lo is not None and not lo <= median <= hi:
                raise ValueError("Confidence bounds do not bracket median")
            numeric.append({k: (None if row[k] == "" else float(row[k])) for k in COLUMNS})
        if smoke_year is None and not any(r["reliable"] and r["idea_vintage_median_years"] is not None for r in numeric):
            raise ValueError("No reliable citation-latency observations")
        validated[path.name] = {"sha256": digest(path.read_bytes()), "rows": len(rows)}
    return validated


def safe_request(params):
    """Only frozen generator requests can reach transport or persisted receipts."""
    params = dict(params)
    if params.pop("mailto", "") != "":
        raise ValueError("Credentials belong in the managed transport only")
    if not set(params) <= {"filter", "per-page", "sample", "seed", "select"}:
        raise ValueError("Unknown OpenAlex request parameter")
    filt = params.get("filter", "")
    year_part = filt.rsplit(":", 1)[-1]
    field = next((q for _, q in FIELDS.values() if filt == "title_and_abstract.search:" + q + ",publication_year:" + year_part), None)
    valid_year = re.fullmatch(r"[12][0-9]{3}", year_part)
    count_request = (set(params) == {"filter", "per-page"} and params["per-page"] == 1
                     and valid_year and (field or filt == "publication_year:" + year_part))
    sample_request = (field and valid_year and set(params) == {"filter", "per-page", "sample", "seed", "select"}
                      and type(params["sample"]) is int and 1 <= params["sample"] <= 80
                      and params["seed"] == 42 and params["per-page"] == 80
                      and params["select"] == "id,publication_year,referenced_works")
    ref_request = (set(params) == {"filter", "per-page", "select"} and params["per-page"] == 50
                   and params["select"] == "id,publication_year"
                   and re.fullmatch(r"openalex_id:W[0-9]+(?:\|W[0-9]+){0,49}", filt))
    if not (count_request or sample_request or ref_request):
        raise ValueError("Request violates frozen OpenAlex contract")
    return params


def safe_response(params, raw, population=None):
    """Keep exact consumed source values, never arbitrary upstream URLs/messages."""
    try:
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError()
        data = json.loads(raw)
        if "select" not in params:
            count = data["meta"]["count"]
            if type(count) is not int or count < 0:
                raise ValueError()
            return {"meta": {"count": count}}
        results = data["results"]
        sample = "sample" in params
        expected = (params["sample"] if population is None else min(params["sample"], population)) if sample else len(params["filter"].split(":", 1)[1].split("|"))
        if not isinstance(results, list) or (len(results) != expected if sample else len(results) > expected):
            raise ValueError()
        projected = []
        seen = set()
        requested = set(params["filter"].split(":", 1)[1].split("|")) if not sample else set()
        for work in results:
            wid = work["id"]
            if not isinstance(wid, str) or not re.fullmatch(r"(?:https://openalex.org/)?W[0-9]+", wid) or wid in seen:
                raise ValueError()
            seen.add(wid)
            if not sample and wid.rsplit("/", 1)[-1] not in requested:
                raise ValueError()
            year = work["publication_year"]
            if year is not None and (type(year) is not int or not 1 <= year <= 2999):
                raise ValueError()
            if sample and year != int(params["filter"].rsplit(":", 1)[1]):
                raise ValueError()
            item = {"id": wid, "publication_year": year}
            if sample:
                refs = work["referenced_works"]
                if refs is not None and (not isinstance(refs, list) or any(
                        not isinstance(r, str) or not re.fullmatch(r"(?:https://openalex.org/)?W[0-9]+", r) for r in refs)):
                    raise ValueError()
                item["referenced_works"] = refs
            projected.append(item)
        return {"results": projected}
    except (ValueError, TypeError, KeyError, AttributeError):
        raise RuntimeError("Invalid OpenAlex response schema") from None


class CurlTransport:
    """curl >= 8.3 imports the environment handle; Python never reads its value."""
    def request(self, path, params):
        if path not in ("/works", "/rate-limit"):
            raise ValueError("Unsupported OpenAlex endpoint")
        if path == "/works":
            params = safe_request(params)
        elif params:
            raise ValueError("Rate preflight takes no parameters")
        query = urllib.parse.urlencode(params, safe="|:,")
        argv = ["curl", "-q", "--silent", "--show-error", "--proto", "=https",
                "--max-redirs", "0", "--retry", "0", "--connect-timeout", "10", "--max-time", "30",
                "--max-filesize", "2000000", "--suppress-connect-headers", "--include",
                "--variable", "%OPENALEX_API_KEY", "--expand-header",
                "Authorization: Bearer {{OPENALEX_API_KEY}}", "--header", "Accept: application/json",
                "--user-agent", "plrd-methodology-citation-refresh/1",
                "https://api.openalex.org" + path + ("?" + query if query else "")]
        try:
            result = subprocess.run(argv, capture_output=True, timeout=35, check=False)
            if result.returncode:
                raise ValueError()
            header, separator, body = result.stdout.partition(b"\r\n\r\n")
            if not separator or len(header) > 65536 or len(body) > 2000000:
                raise ValueError()
            lines = header.decode("ascii").split("\r\n")
            code = int(lines[0].split(" ")[1])
            selected = {}
            content_type = ""
            for line in lines[1:]:
                name, _, value = line.partition(":")
                name, value = name.lower(), value.strip()
                if name == "content-type":
                    content_type = value.lower()
                if name in ("x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-credits-used"):
                    if not value.isdigit():
                        raise ValueError()
                    selected[name] = value
                if name == "retry-after":
                    selected[name] = value  # in memory only; never in saved receipts
            if code == 200 and not content_type.startswith("application/json"):
                raise ValueError()
            if path == "/rate-limit":
                if code != 200:
                    raise ValueError()
                rate = json.loads(body).get("rate_limit", {})
                fields = ("daily_budget_usd", "daily_used_usd", "daily_remaining_usd", "prepaid_remaining_usd")
                report = {"rate_limit": {key: rate.get(key) for key in fields}}
                free_remaining(report)  # reject unknown/non-numeric before returning
                body = encoded(report)
            return code, selected, body
        except Exception:
            # Never render stderr, provider exception, header, URL, or rate body.
            raise RuntimeError("OpenAlex native transport failed") from None

    def preflight(self):
        return json.loads(self.request("/rate-limit", {})[2])

    def __call__(self, params):
        return self.request("/works", params)


def free_remaining(report):
    """Reviewed DAILY FREE quota only. Unknown schema/prepaid balances fail shut."""
    try:
        rate = report["rate_limit"]
        limit, used, remaining, prepaid = (Decimal(str(rate[k])) for k in (
            "daily_budget_usd", "daily_used_usd", "daily_remaining_usd", "prepaid_remaining_usd"))
        if (not all(v.is_finite() for v in (limit, used, remaining, prepaid))
                or not 0 < limit <= 1 or not 0 <= used <= limit
                or remaining != limit - used or prepaid != 0):
            raise ValueError()
        return int(remaining * 10000)
    except (KeyError, InvalidOperation, ValueError, TypeError):
        raise RuntimeError("Cannot establish separate daily free allowance") from None


class Budget:
    def __init__(self, remaining, *, reserve=1000, cap=7000):
        if any(type(x) is not int or x < 0 for x in (remaining, reserve, cap)) or remaining > 10000:
            raise ValueError("Invalid free allowance budget")
        self.remaining, self.reserve, self.cap, self.spent = remaining, reserve, cap, 0

    def charge(self, credits):
        if self.spent + credits > self.cap or self.remaining - credits < self.reserve:
            raise RuntimeError("Free allowance/run cap exhausted; no prepaid spill")
        self.spent += credits
        self.remaining -= credits

    def observe(self, headers):
        try:
            values = {k.lower(): v for k, v in headers.items()}
            remaining = int(values["x-ratelimit-remaining"])
            limit = int(values["x-ratelimit-limit"])
            if not 0 <= remaining <= limit <= 10000:
                raise ValueError()
        except (KeyError, TypeError, ValueError):
            raise RuntimeError("Missing or changed daily quota headers") from None
        self.remaining = min(self.remaining, remaining)
        if self.remaining < self.reserve:
            raise RuntimeError("Shared daily free allowance crossed reserve")


class Acquisition:
    """One-run cache and bounded request budget (retries consume the budget)."""
    def __init__(self, transport, *, max_requests=10000, attempts=3, sleep=time.sleep, budget=None,
                 on_record=None, on_event=None):
        if not 1 <= max_requests <= 100000 or not 1 <= attempts <= 6:
            raise ValueError("Invalid request cap or retry bound")
        self.transport = transport
        self.max_requests = max_requests
        self.attempts = attempts
        self.sleep = sleep
        self.requests = 0
        self.cache = {}
        self.records = []
        self.receipts = []
        self.budget = budget
        self.on_record = on_record or (lambda record: None)
        self.on_event = on_event or (lambda event: None)
        self.used = set()

    def event(self, value):
        self.receipts.append(value)
        self.on_event(value)

    def fetch(self, params, email="", api_key=""):
        if email or api_key:
            raise ValueError("Credentials belong in the managed transport only")
        params = safe_request(params)
        key = digest(encoded(params))
        self.used.add(key)
        if key in self.cache:
            self.event({"key": key, "outcome": "cache_hit"})
            return self.cache[key]
        delay = 2
        for attempt in range(1, self.attempts + 1):
            if self.requests >= self.max_requests:
                raise RuntimeError("OpenAlex per-run request cap reached")
            if self.budget:
                self.budget.charge(10 if "title_and_abstract.search:" in params["filter"] else 1)
            self.requests += 1
            self.event({"key": key, "attempt": attempt, "outcome": "attempted"})
            try:
                status, headers, raw = self.transport(params)
            except Exception:
                status, headers, raw = 0, {}, b""
            self.event({"key": key, "attempt": attempt, "status": status})
            if self.budget and status:
                self.budget.observe(headers)
            if status == 200:
                count_key = digest(encoded({"filter": params["filter"], "per-page": 1}))
                population = self.cache.get(count_key, {}).get("meta", {}).get("count")
                payload = safe_response(params, raw, population)
                self.cache[key] = payload
                record = {"request": params, "response": payload, "raw_sha256": digest(raw),
                          "response_sha256": digest(encoded(payload))}
                self.records.append(record)
                self.on_record(record)
                return payload
            body = raw[:65536].decode("utf-8", errors="replace").lower()
            if status == 429 and "daily" in body and any(w in body for w in ("quota", "limit", "budget")):
                raise RuntimeError("OpenAlex daily quota exhausted")
            if status not in (0, 429, 500, 502, 503, 504):
                raise RuntimeError("OpenAlex request permanently rejected")
            if attempt < self.attempts and self.requests < self.max_requests:
                retry = next((v for k, v in headers.items() if k.lower() in ("retry-after", "retryafter")), None)
                self.sleep(generator.retry_wait(retry, delay))
                delay = min(delay * 2, 60)
        raise RuntimeError("OpenAlex request failed after bounded retries")


def load_capture(folder, current_year, *, partial=False):
    folder = Path(folder)
    manifest = json.loads((folder / "manifest.json").read_bytes())
    if (manifest.get("version") != 1 or encoded(manifest.get("contract")) != encoded(contract(current_year))
            or manifest.get("status") not in (("incomplete", "staged") if partial else ("staged",))):
        raise ValueError("Replay/resume requires a matching pinned acquisition contract")
    if manifest["status"] == "staged":
        raw = (folder / "acquisition.json").read_bytes()
        if digest(raw) != manifest["acquisition_sha256"]:
            raise ValueError("Acquisition receipt hash mismatch")
        records = json.loads(raw)
    else:
        # Each source is durable before the next request; also survives hard exits.
        records = [json.loads(p.read_bytes()) for p in sorted((folder / "sources").glob("*.json"))]
    populations = {r["request"]["filter"]: r["response"]["meta"]["count"] for r in records if "meta" in r["response"]}
    seen = set()
    for record in records:
        params = safe_request(record["request"])
        key = digest(encoded(params))
        if (key in seen or digest(encoded(record["response"])) != record["response_sha256"]
                or not re.fullmatch(r"[0-9a-f]{64}", record["raw_sha256"])):
            raise ValueError("Invalid source receipt hash or duplicate request")
        safe_response(params, encoded(record["response"]), populations.get(params["filter"]))
        seen.add(key)
    return manifest, records


def run(stage_dir, *, current_year, transport=None, max_requests=10000, attempts=3,
        replay=None, resume=None, budget=None, smoke_year=None):
    if replay and (resume or transport is not None):
        raise ValueError("Replay cannot acquire")
    if smoke_year is not None and (replay or resume or not 2005 <= smoke_year <= current_year):
        raise ValueError("Smoke requires a fresh staged acquisition year common to all four areas")
    prior, records = load_capture(replay or resume, current_year, partial=bool(resume)) if replay or resume else ({}, [])
    if transport is None and not replay:
        raise ValueError("Acquisition needs an explicit transport")
    stage = Path(stage_dir)
    stage.mkdir(mode=0o700, parents=True, exist_ok=False)
    (stage / "csv").mkdir()
    (stage / "sources").mkdir()
    def record_source(record):
        key = digest(encoded(record["request"]))
        atomic_write(stage / "sources" / (key + ".json"), encoded(record))
    def record_event(event):
        with (stage / "requests.jsonl").open("ab") as stream:
            stream.write(encoded(event))
            stream.flush()
            os.fsync(stream.fileno())
    def offline(params):
        raise ValueError("Replay missing source request")
    acquisition = Acquisition(transport or offline, max_requests=max_requests, attempts=attempts,
                              budget=budget, on_record=record_source, on_event=record_event)
    for record in records:
        key = digest(encoded(record["request"]))
        acquisition.cache[key] = record["response"]
        acquisition.records.append(record)
        record_source(record)
    fetch = acquisition.fetch
    generated = prior.get("generated") or dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    manifest = {"version": 1, "status": "incomplete", "generated": generated,
                "contract": contract(current_year, smoke_year), "files": {}}
    atomic_write(stage / "manifest.json", encoded(manifest))
    all_counts = {}
    try:
        for slug, (start, query) in FIELDS.items():
            rows = []
            for year in ([smoke_year] if smoke_year is not None else range(start, current_year + 1)):
                if year not in all_counts:
                    all_counts[year] = generator.count(f"publication_year:{year}", "", "", fetcher=fetch)
                row = generator.year_row(year, query, all_counts[year], 80, 50, "", "", fetcher=fetch)
                row.update(first_time_authors="", reliable=int(year < current_year - 2))
                rows.append(row)
            atomic_write(stage / "csv" / (slug + ".csv"), render(slug, rows, current_year, generated))
        manifest["files"] = validate_set(stage / "csv", current_year, smoke_year)
        if replay and (manifest["files"] != prior["files"] or acquisition.used != set(acquisition.cache)):
            raise ValueError("Replay did not reproduce the complete exact four-file set")
        manifest["status"] = "smoke" if smoke_year is not None else "staged"
    finally:
        raw = encoded(acquisition.records)
        atomic_write(stage / "acquisition.json", raw)
        atomic_write(stage / "requests.json", encoded(acquisition.receipts))
        manifest.update(requests=acquisition.requests, acquisition_sha256=digest(raw),
                        requests_sha256=digest((stage / "requests.json").read_bytes()),
                        worst_case_credits=budget.spent if budget else None)
        atomic_write(stage / "manifest.json", encoded(manifest))
    return manifest


def semantic_csv(path):
    meta, columns, rows = read_csv(path)
    meta.pop("generated", None)
    return meta, columns, [[None if row[k] == "" else Decimal(row[k]) for k in columns] for row in rows]


def restore_transaction(live, transaction):
    journal = json.loads((transaction / "journal.json").read_bytes())
    if set(journal) != {s + ".csv" for s in FIELDS}:
        raise ValueError("Invalid rollback file set")
    # Validate ALL backups and targets before recovery touches anything.
    for name, entry in journal.items():
        target = live / name
        current = digest(target.read_bytes()) if target.exists() else None
        if target.is_symlink() or current not in (entry["sha256"], entry["installed_sha256"]):
            raise ValueError("Rollback target changed concurrently; manual recovery required")
        if entry["sha256"] is not None and digest((transaction / name).read_bytes()) != entry["sha256"]:
            raise ValueError("Rollback backup hash mismatch; manual recovery required")
    for name, entry in journal.items():
        target = live / name
        if entry["sha256"] is None:
            target.unlink(missing_ok=True)
        else:
            data = (transaction / name).read_bytes()
            if digest(data) != entry["sha256"]:
                raise ValueError("Rollback backup hash mismatch; preserve transaction for recovery")
            atomic_write(target, data)
            os.chmod(target, entry["mode"])
            os.utime(target, ns=(entry["atime_ns"], entry["mtime_ns"]))
    shutil.rmtree(transaction)


def install(stage_dir, live_dir):
    """Validate the complete set before any live mutation; rollback on failure."""
    stage, live = Path(stage_dir), Path(live_dir)
    manifest = json.loads((stage / "manifest.json").read_bytes())
    year = manifest["contract"]["year"]
    load_capture(stage, year)
    if validate_set(stage / "csv", year) != manifest["files"]:
        raise ValueError("Staged CSV hashes disagree with acquisition manifest")
    live.mkdir(parents=True, exist_ok=True)
    with (live / ".openalex-install.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError("OpenAlex install lock is busy") from None
        transaction = live / ".openalex-transaction"
        if transaction.exists():
            restore_transaction(live, transaction)
        changed, unchanged = [], []
        before = {}
        for name in manifest["files"]:
            target = live / name
            if target.is_symlink():
                raise ValueError("Refusing symlinked live CSV")
            before[name] = digest(target.read_bytes()) if target.exists() else None
            if target.exists():
                previous = {r["year"]: r for r in read_csv(target)[2]}
                for row in read_csv(stage / "csv" / name)[2]:
                    old = previous.get(row["year"], {})
                    if old.get("idea_vintage_median_years") and not row["idea_vintage_median_years"]:
                        raise ValueError("New historical missingness requires review; keep previous set")
            (unchanged if target.exists() and semantic_csv(target) == semantic_csv(stage / "csv" / name)
             else changed).append(name)
        receipt = {"changed": sorted(changed), "unchanged": sorted(unchanged), "before": before}
        if changed:
            transaction.mkdir(mode=0o700, exist_ok=False)
            journal = {}
            try:
                for name in manifest["files"]:
                    target = live / name
                    entry = {"sha256": before[name], "installed_sha256": manifest["files"][name]["sha256"]}
                    if target.exists():
                        stat = target.stat()
                        entry.update(mode=stat.st_mode & 0o777, mtime_ns=stat.st_mtime_ns, atime_ns=stat.st_atime_ns)
                        atomic_write(transaction / name, target.read_bytes())
                    journal[name] = entry
                atomic_write(transaction / "journal.json", encoded(journal))
            except BaseException:
                shutil.rmtree(transaction)
                raise
            try:
                for name in changed:
                    target = live / name
                    if (digest(target.read_bytes()) if target.exists() else None) != before[name]:
                        raise ValueError("Live CSV changed concurrently")
                    atomic_write(target, (stage / "csv" / name).read_bytes())
                    os.chmod(target, journal[name].get("mode", 0o644))
                if any(digest((live / name).read_bytes()) != manifest["files"][name]["sha256"] for name in changed):
                    raise ValueError("Installed CSV readback mismatch")
            except BaseException:
                restore_transaction(live, transaction)
                raise
            shutil.rmtree(transaction)
        receipt["after"] = {name: digest((live / name).read_bytes()) for name in manifest["files"]}
        atomic_write(stage / "install.json", encoded(receipt))
        return receipt


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--acquire", action="store_true", help="explicit live requests; stage only")
    mode.add_argument("--replay", type=Path, help="offline complete source capture")
    mode.add_argument("--install-from", type=Path, help="install only a complete validated stage")
    parser.add_argument("--run", type=Path, help="new private staging directory")
    parser.add_argument("--install-to", type=Path, help="live CSV directory; explicit separate operation")
    parser.add_argument("--resume", type=Path, help="reuse partial same-contract receipts during acquisition")
    parser.add_argument("--smoke-year", type=int, help="all four areas for one year; NEVER installable")
    parser.add_argument("--max-requests", type=int, default=10000)
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--max-credits", type=int, default=7000)
    parser.add_argument("--reserve-credits", type=int, default=1000)
    parser.add_argument("--lock", type=Path, default=Path(SHARED_LOCK))
    args = parser.parse_args(argv)
    try:
        if args.install_from:
            if not args.install_to or args.run or args.resume or args.smoke_year is not None:
                raise ValueError("Invalid install flags")
            receipt = install(args.install_from, args.install_to)
            print(json.dumps(receipt, sort_keys=True))
            return 0
        if not args.run or args.install_to or (args.resume and not args.acquire):
            raise ValueError("Invalid staging flags")
        if args.replay:
            year = json.loads((args.replay / "manifest.json").read_bytes())["contract"]["year"]
            result = run(args.run, current_year=year, replay=args.replay, smoke_year=args.smoke_year)
        else:
            # Same lock as the Atlas citation producer. Fail before preflight if busy.
            args.lock.parent.mkdir(parents=True, exist_ok=True)
            with args.lock.open("a") as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                source = CurlTransport()
                budget = Budget(free_remaining(source.preflight()), reserve=args.reserve_credits, cap=args.max_credits)
                year = dt.datetime.now(dt.timezone.utc).year
                # Admission is per request, not the excessively conservative full-run bound.
                result = run(args.run, current_year=year, transport=source, budget=budget,
                             resume=args.resume, smoke_year=args.smoke_year,
                             max_requests=args.max_requests, attempts=args.attempts)
        print(json.dumps({"status": result["status"], "files": result["files"],
                          "requests": result["requests"], "worst_case_credits": result["worst_case_credits"]}, sort_keys=True))
        return 0
    except Exception:
        # Even filesystem/subprocess exceptions may contain private paths or URLs.
        print("OpenAlex weekly operation failed; inspect private staging/recovery receipts. No partial set is eligible for publication.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
