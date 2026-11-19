"""Offline-only weekly runner tests. All acquisitions here are SYNTHETIC TEST DATA."""
import csv
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.velocity import field_velocity_openalex as generator

from scripts.velocity import weekly_openalex as weekly


QUERIES = {
    "digital-human-rights": (2005, "content addressing|peer-to-peer network|censorship resistance|decentralized storage"),
    "economies-governance": (2005, "mechanism design|public goods funding|quadratic funding|digital public infrastructure"),
    "ai-robotics": (2005, "decentralized training|federated learning|multi-agent coordination|embodied AI"),
    "neurotech": (2000, "brain-computer interface|connectome|neural implant|whole brain emulation"),
}


class SyntheticTransport:
    """Exact OpenAlex response shapes, made-up values, never a real-data substitute."""
    def __init__(self):
        self.calls = []

    def __call__(self, params):
        self.calls.append(dict(params))
        if params.get("sample"):
            year = int(params["filter"].rsplit(":", 1)[1])
            payload = {"results": [
                {"id": f"https://openalex.org/W{i}", "publication_year": year,
                 "referenced_works": ["https://openalex.org/W101", "https://openalex.org/W102"]}
                for i in range(1, 9)]}
        elif params["filter"].startswith("openalex_id:"):
            payload = {"results": [
                {"id": "https://openalex.org/W101", "publication_year": 1990},
                {"id": "https://openalex.org/W102", "publication_year": 1995}]}
        else:
            payload = {"meta": {"count": 1000 if params["filter"].startswith("publication_year:") else 8}}
        return 200, {}, json.dumps(payload).encode()


class WeeklyTests(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(weekly, "weekly full-set runner is missing")
        self.temp = self.enterContext(tempfile.TemporaryDirectory())
        self.root = Path(self.temp)
        self.enterContext(patch.object(generator.time, "sleep"))
        self.enterContext(patch.object(generator.urllib.request, "urlopen", side_effect=AssertionError("network forbidden")))

    def stage(self, name="stage", **kwargs):
        return weekly.run(self.root / name, current_year=2026,
                          transport=kwargs.pop("transport", SyntheticTransport()), **kwargs)

    def test_full_frozen_history_is_staged_without_live_writes(self):
        live = self.root / "live"
        live.mkdir()
        for slug in QUERIES:
            (live / f"{slug}.csv").write_text("old live bytes\n")
        before = {p.name: p.read_bytes() for p in live.iterdir()}
        transport = SyntheticTransport()
        manifest = self.stage(transport=transport)
        self.assertEqual(before, {p.name: p.read_bytes() for p in live.iterdir()})
        self.assertEqual(manifest["status"], "staged")
        self.assertEqual(manifest["contract"]["cutoff"], 2024)
        self.assertEqual(set(manifest["files"]), {s + ".csv" for s in QUERIES})
        for slug, (start, query) in QUERIES.items():
            text = (self.root / "stage" / "csv" / f"{slug}.csv").read_text()
            self.assertIn("# query: " + query + "\n", text)
            self.assertIn("works_per_year=80; max_refs_per_work=50", text)
            self.assertIn("ci=cluster_bootstrap(resample=works,iters=500,seed=42)", text)
            rows = list(csv.DictReader(l for l in text.splitlines() if not l.startswith("#")))
            self.assertEqual([int(r["year"]) for r in rows], list(range(start, 2027)))
            self.assertTrue(all(r["reliable"] == str(int(int(r["year"]) < 2024)) for r in rows))
            self.assertTrue(all(r["first_time_authors"] == "" for r in rows))
            self.assertTrue(all(r["n_works_sampled"] == "8" for r in rows))
        samples = [p for p in transport.calls if "sample" in p]
        self.assertEqual(len(samples), 93)
        self.assertTrue(all(p["sample"] == 8 and p["seed"] == 42 and p["per-page"] == 80 for p in samples))
        self.assertTrue((self.root / "stage" / "acquisition.json").exists())

    def test_validation_rejects_partial_schema_provenance_and_invalid_numbers(self):
        self.stage()
        folder = self.root / "stage" / "csv"
        self.assertTrue(callable(getattr(weekly, "validate_set", None)), "full-set validator is missing")
        original = (folder / "neurotech.csv").read_text()
        cases = [
            ("wrong query", original.replace(QUERIES["neurotech"][1], "changed query")),
            ("wrong cutoff", original.replace("# reliable_cutoff_year: 2024", "# reliable_cutoff_year: 2023")),
            ("wrong sample", original.replace("works_per_year=80", "works_per_year=120")),
            ("wrong schema", original.replace("n_works_sampled,", "unknown_column,")),
            ("missing year", "\n".join(l for l in original.splitlines() if not l.startswith("2001,")) + "\n"),
            ("wrong reliability", original.replace("16,8,1\n", "16,8,0\n", 1)),
            ("nonfinite", original.replace("2000,8,1000,800.0,,7.5", "2000,8,1000,800.0,,nan")),
            ("wrong share", original.replace("800.0", "900.0", 1)),
            ("missing median", original.replace(",,7.5,7.5,7.5,16,8,1", ",,,,16,8,1", 1)),
            ("invalid CI", original.replace(",7.5,7.5,7.5,16,8,1", ",7.5,9,10,16,8,1", 1)),
            ("impossible counts", original.replace("16,8,1\n", "401,8,1\n", 1)),
            ("invalid author proxy", original.replace("800.0,,", "800.0,2,", 1)),
        ]
        for label, text in cases:
            with self.subTest(label=label):
                self.assertNotEqual(text, original, "fixture mutation did not apply")
                (folder / "neurotech.csv").write_text(text)
                with self.assertRaises(ValueError):
                    weekly.validate_set(folder, 2026)
        (folder / "neurotech.csv").write_text(original)
        weekly.validate_set(folder, 2026)
        (folder / "neurotech.csv").unlink()
        with self.assertRaises(ValueError):
            weekly.validate_set(folder, 2026)

    def test_bounded_acquisition_retries_caps_and_quota_are_sanitized(self):
        self.assertTrue(callable(getattr(weekly, "Acquisition", None)), "bounded acquisition is missing")
        request = {"filter": "publication_year:2020", "per-page": 1}
        fake_secret = "SYNTHETIC_NEVER_REAL_KEY"
        for status, body in [(429, b'{"error":"Daily quota exceeded"}'), (401, b"unsafe"), (403, b"unsafe")]:
            with self.subTest(status=status):
                calls = []
                def denied(params):
                    calls.append(params)
                    return status, {}, body
                acq = weekly.Acquisition(denied, max_requests=5, attempts=3)
                with self.assertRaises(RuntimeError):
                    acq.fetch(request)
                self.assertEqual(len(calls), 1)
        replies = iter([(503, {"Retry-After": "999999"}, b"unsafe"),
                        (200, {}, b'{"meta":{"count":8}}')])
        sleeps = []
        acq = weekly.Acquisition(lambda p: next(replies), max_requests=2, attempts=3, sleep=sleeps.append)
        self.assertEqual(acq.fetch(request), {"meta": {"count": 8}})
        self.assertEqual(acq.fetch(request), {"meta": {"count": 8}})  # same-run cache
        self.assertEqual(sleeps, [120])
        with self.assertRaisesRegex(RuntimeError, "request cap"):
            acq.fetch({"filter": "publication_year:2021", "per-page": 1})
        self.assertEqual(acq.requests, 2)
        def broken(params):
            raise OSError("https://example.invalid/?api_key=" + fake_secret)
        acq = weekly.Acquisition(broken, max_requests=4, attempts=2, sleep=sleeps.append)
        import traceback
        try:
            acq.fetch(request)
        except RuntimeError:
            diagnostic = traceback.format_exc() + json.dumps(acq.receipts)
        else:
            self.fail("must fail after bounded retries")
        self.assertNotIn(fake_secret, diagnostic)
        self.assertNotIn("https://example.invalid", diagnostic)
        self.assertEqual(acq.requests, 2)

    def test_acquisition_allowlists_responses_and_rejects_malformed_or_secret_requests(self):
        request = {"filter": "publication_year:2020", "per-page": 1}
        unsafe = "https://example.invalid/?api_key=SYNTHETIC_SECRET"
        acq = weekly.Acquisition(lambda p: (200, {}, json.dumps({
            "meta": {"count": 8, "unsafe": unsafe}, "unsafe": unsafe}).encode()))
        self.assertEqual(acq.fetch(request), {"meta": {"count": 8}})
        self.assertNotIn(unsafe, json.dumps(acq.records))
        for payload in [{}, {"meta": {"count": -1}}, {"meta": {"count": True}},
                        {"meta": {"count": 1.2}}, {"meta": {"count": "8"}}]:
            with self.subTest(payload=payload):
                acq = weekly.Acquisition(lambda p: (200, {}, json.dumps(payload).encode()))
                with self.assertRaisesRegex(RuntimeError, "response"):
                    acq.fetch(request)
                self.assertEqual(acq.records, [])
        for bad in [dict(request, api_key="SYNTHETIC"), dict(request, mailto=unsafe),
                    {"filter": unsafe, "per-page": 1},
                    {"filter": "title_and_abstract.search:" + QUERIES["neurotech"][1] + ",publication_year:2020,unexpected:2021", "per-page": 1}]:
            acq = weekly.Acquisition(lambda p: self.fail("unsafe request reached transport"))
            with self.assertRaises(ValueError):
                acq.fetch(bad)
        sample = {"filter": "title_and_abstract.search:" + QUERIES["neurotech"][1] + ",publication_year:2020",
                  "sample": 8, "seed": 42, "per-page": 80, "select": "id,publication_year,referenced_works"}
        valid = json.loads(SyntheticTransport()(sample)[2])
        for mutate in [lambda p: p["results"].pop(),
                       lambda p: p["results"][0].update(id=unsafe),
                       lambda p: p["results"][0].update(publication_year=2019),
                       lambda p: p["results"][0].update(referenced_works=[unsafe]),
                       lambda p: p["results"].append(p["results"][0])]:
            payload = json.loads(json.dumps(valid))
            mutate(payload)
            acq = weekly.Acquisition(lambda p: (200, {}, json.dumps(payload).encode()))
            with self.assertRaises(RuntimeError):
                acq.fetch(sample)

    def test_free_budget_charges_search_ten_and_stops_before_prepaid_or_reserve(self):
        self.assertTrue(callable(getattr(weekly, "Budget", None)), "free-only budget is missing")
        report = {"rate_limit": {"daily_budget_usd": 1, "daily_used_usd": .2,
                                  "daily_remaining_usd": .8, "prepaid_remaining_usd": 0}}
        self.assertEqual(weekly.free_remaining(report), 8000)
        for change in [{"prepaid_remaining_usd": .01}, {"daily_remaining_usd": 1},
                       {"daily_budget_usd": "nan"}, {"daily_remaining_usd": "Infinity"}]:
            invalid = json.loads(json.dumps(report))
            invalid["rate_limit"].update(change)
            with self.assertRaises(RuntimeError):
                weekly.free_remaining(invalid)
        calls = []
        def source(params):
            calls.append(params)
            return 200, {"X-RateLimit-Limit": "10000", "X-RateLimit-Remaining": "7990"}, b'{"meta":{"count":8}}'
        budget = weekly.Budget(8000, reserve=1000, cap=10)
        acq = weekly.Acquisition(source, budget=budget)
        acq.fetch({"filter": "title_and_abstract.search:" + QUERIES["neurotech"][1] + ",publication_year:2020", "per-page": 1})
        self.assertEqual(budget.spent, 10)
        with self.assertRaises(RuntimeError):
            acq.fetch({"filter": "publication_year:2020", "per-page": 1})
        self.assertEqual(len(calls), 1)
        budget = weekly.Budget(1000, reserve=1000, cap=7000)
        acq = weekly.Acquisition(source, budget=budget)
        with self.assertRaises(RuntimeError):
            acq.fetch({"filter": "publication_year:2020", "per-page": 1})
        self.assertEqual(len(calls), 1)
        budget = weekly.Budget(8000, reserve=1000, cap=7000)
        with self.assertRaises(RuntimeError):
            budget.observe({})
        budget.observe({"X-RateLimit-Limit": "10000", "X-RateLimit-Remaining": "1200"})
        self.assertEqual(budget.remaining, 1200)
        with self.assertRaises(RuntimeError):
            budget.observe({"X-RateLimit-Limit": "10000", "X-RateLimit-Remaining": "999"})

    def test_native_curl_uses_environment_handle_and_discards_private_rate_response(self):
        self.assertTrue(callable(getattr(weekly, "CurlTransport", None)), "native curl transport is missing")
        import types
        private = "SYNTHETIC_PRIVATE_KEY_NEVER_REAL"
        body = json.dumps({"api_key": private, "rate_limit": {
            "daily_budget_usd": 1, "daily_used_usd": .2,
            "daily_remaining_usd": .8, "prepaid_remaining_usd": 0}}).encode()
        response = (b"HTTP/2 200\r\ncontent-type: application/json\r\n"
                    b"x-ratelimit-limit: 10000\r\nx-ratelimit-remaining: 8000\r\n\r\n" + body)
        def execute(argv, **kwargs):
            self.assertEqual(argv[:2], ["curl", "-q"])
            self.assertIn("%OPENALEX_API_KEY", argv)
            self.assertIn("Authorization: Bearer {{OPENALEX_API_KEY}}", argv)
            self.assertNotIn(private, " ".join(argv))
            self.assertNotIn("env", kwargs)  # no Python credential handling
            self.assertIn("--max-time", argv)
            self.assertIn("--max-filesize", argv)
            self.assertEqual(argv[-1], "https://api.openalex.org/rate-limit")
            return types.SimpleNamespace(returncode=0, stdout=response, stderr=b"unsafe " + private.encode())
        with patch.object(weekly.subprocess, "run", side_effect=execute):
            source = weekly.CurlTransport()
            report = source.preflight()
        self.assertEqual(weekly.free_remaining(report), 8000)
        self.assertNotIn(private, json.dumps(report))
        with patch.object(weekly.subprocess, "run", side_effect=OSError(private)):
            with self.assertRaisesRegex(RuntimeError, "native transport") as failure:
                weekly.CurlTransport().preflight()
        self.assertNotIn(private, str(failure.exception))
        with patch.object(weekly.subprocess, "run", return_value=types.SimpleNamespace(
                returncode=0, stdout=b"HTTP/2 200\r\ncontent-type: text/html\r\n\r\nunsafe", stderr=b"")):
            with self.assertRaises(RuntimeError):
                weekly.CurlTransport().preflight()

    def test_failed_run_retains_resumable_sources_and_replay_is_byte_exact(self):
        with self.assertRaises(RuntimeError):
            self.stage(max_requests=5)
        folder = self.root / "stage"
        self.assertTrue((folder / "manifest.json").exists(), "failed acquisition lost resumable manifest")
        partial = json.loads((folder / "manifest.json").read_bytes())
        self.assertEqual(partial["status"], "incomplete")
        self.assertGreater(len(list((folder / "sources").glob("*.json"))), 0)
        with self.assertRaises(ValueError):
            weekly.run(self.root / "bad-replay", current_year=2026, replay=folder)
        source = SyntheticTransport()
        completed = weekly.run(self.root / "resumed", current_year=2026, transport=source, resume=folder)
        self.assertEqual(completed["generated"], partial["generated"])
        self.assertLess(len(source.calls), 214)
        replayed = weekly.run(self.root / "replayed", current_year=2026, replay=self.root / "resumed")
        self.assertEqual(replayed["files"], completed["files"])
        self.assertEqual(replayed["requests"], 0)
        for slug in QUERIES:
            name = slug + ".csv"
            self.assertEqual((self.root / "resumed/csv" / name).read_bytes(),
                             (self.root / "replayed/csv" / name).read_bytes())
        with (self.root / "resumed/acquisition.json").open("ab") as f:
            f.write(b" ")
        with self.assertRaises(ValueError):
            weekly.run(self.root / "tampered", current_year=2026, replay=self.root / "resumed")

    def test_install_is_full_set_rollback_safe_and_timestamp_noops_preserve_files(self):
        self.stage()
        self.assertTrue(callable(getattr(weekly, "install", None)), "full-set installer is missing")
        live = self.root / "live"
        live.mkdir()
        first = weekly.install(self.root / "stage", live)
        self.assertEqual(set(first["changed"]), {s + ".csv" for s in QUERIES})
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in live.glob("*.csv")}
        self.stage("second")
        # Explicitly make only generated-at different (without touching numeric data).
        stage = self.root / "second"
        manifest = json.loads((stage / "manifest.json").read_text())
        for path in (stage / "csv").glob("*.csv"):
            path.write_text(path.read_text().replace(manifest["generated"], "2026-11-05T01:02:03+00:00"))
        manifest["generated"] = "2026-11-05T01:02:03+00:00"
        manifest["files"] = weekly.validate_set(stage / "csv", 2026)
        (stage / "manifest.json").write_bytes(weekly.encoded(manifest))
        result = weekly.install(stage, live)
        self.assertEqual(result["changed"], [])
        self.assertEqual(before, {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in live.glob("*.csv")})
        # Valid changed acquisition: change only all-work counts/share for all fields.
        for path in (stage / "csv").glob("*.csv"):
            path.write_text(path.read_text().replace(",8,1000,800.0,", ",8,2000,400.0,"))
        manifest["files"] = weekly.validate_set(stage / "csv", 2026)
        (stage / "manifest.json").write_bytes(weekly.encoded(manifest))
        replace = weekly.os.replace
        replacements = []
        def fail_third(source, target):
            if Path(target).parent == live and str(target).endswith(".csv"):
                replacements.append(str(target))
                if len(replacements) == 3:
                    raise OSError("synthetic install failure")
            return replace(source, target)
        with patch.object(weekly.os, "replace", side_effect=fail_third):
            with self.assertRaises(OSError):
                weekly.install(stage, live)
        self.assertEqual(before, {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in live.glob("*.csv")})
        self.assertFalse((live / ".openalex-transaction").exists())
        result = weekly.install(stage, live)
        self.assertEqual(len(result["changed"]), 4)
        for path in live.glob("*.csv"):
            self.assertEqual(path.read_bytes(), (stage / "csv" / path.name).read_bytes())

    def test_interrupted_install_is_recovered_before_next_install(self):
        self.stage()
        live = self.root / "live"
        live.mkdir()
        weekly.install(self.root / "stage", live)
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in live.glob("*.csv")}
        self.stage("changed")
        changed = self.root / "changed"
        manifest = json.loads((changed / "manifest.json").read_text())
        for path in (changed / "csv").glob("*.csv"):
            path.write_text(path.read_text().replace(",8,1000,800.0,", ",8,2000,400.0,"))
        manifest["files"] = weekly.validate_set(changed / "csv", 2026)
        (changed / "manifest.json").write_bytes(weekly.encoded(manifest))
        replace = weekly.os.replace
        writes = []
        def interrupted(source, target):
            if Path(target).parent == live and str(target).endswith(".csv"):
                writes.append(target)
                if len(writes) == 2:
                    raise OSError("synthetic interrupted install")
            return replace(source, target)
        with patch.object(weekly.os, "replace", side_effect=interrupted), patch.object(
                weekly, "restore_transaction", side_effect=RuntimeError("simulate process death before rollback")):
            with self.assertRaises(RuntimeError):
                weekly.install(changed, live)
        self.assertTrue((live / ".openalex-transaction/journal.json").exists())
        receipt = weekly.install(self.root / "stage", live)
        self.assertEqual(receipt["changed"], [])
        self.assertEqual(before, {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in live.glob("*.csv")})
        self.assertFalse((live / ".openalex-transaction").exists())

    def test_install_rejects_new_historical_missingness_before_writing(self):
        self.stage()
        live = self.root / "live"
        live.mkdir()
        weekly.install(self.root / "stage", live)
        before = {p.name: p.read_bytes() for p in live.glob("*.csv")}
        stage = self.root / "stage"
        path = stage / "csv/neurotech.csv"
        path.write_text(path.read_text().replace(",,7.5,7.5,7.5,16,8,1", ",,,,,0,0,1", 1))
        manifest = json.loads((stage / "manifest.json").read_text())
        manifest["files"] = weekly.validate_set(stage / "csv", 2026)
        (stage / "manifest.json").write_bytes(weekly.encoded(manifest))
        with self.assertRaisesRegex(ValueError, "missingness"):
            weekly.install(stage, live)
        self.assertEqual(before, {p.name: p.read_bytes() for p in live.glob("*.csv")})

    def test_cli_smoke_stages_all_four_and_busy_shared_lock_prevents_preflight(self):
        self.assertTrue(callable(getattr(weekly, "main", None)), "runner CLI is missing")
        import contextlib
        import io
        import fcntl
        class SyntheticQuotaTransport(SyntheticTransport):
            def preflight(self):
                return {"rate_limit": {"daily_budget_usd": 1, "daily_used_usd": 0,
                        "daily_remaining_usd": 1, "prepaid_remaining_usd": 0}}
            def __call__(self, params):
                code, headers, body = super().__call__(params)
                return code, {"X-RateLimit-Limit": "10000", "X-RateLimit-Remaining": "9900"}, body
        source = SyntheticQuotaTransport()
        lock = self.root / "shared.lock"
        with patch.object(weekly, "CurlTransport", return_value=source), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(weekly.main(["--acquire", "--smoke-year", "2020", "--run", str(self.root / "smoke"),
                                          "--lock", str(lock)]), 0)
            manifest = json.loads((self.root / "smoke/manifest.json").read_text())
            self.assertEqual(manifest["status"], "smoke")
            self.assertEqual(len(manifest["files"]), 4)
            self.assertTrue(all(f["rows"] == 1 for f in manifest["files"].values()))
            self.assertEqual(weekly.main(["--install-from", str(self.root / "smoke"),
                                         "--install-to", str(self.root / "live")]), 1)
            self.assertFalse((self.root / "live").exists())
            count = len(source.calls)
            with lock.open("a") as held:
                fcntl.flock(held, fcntl.LOCK_EX | fcntl.LOCK_NB)
                self.assertEqual(weekly.main(["--acquire", "--run", str(self.root / "busy"), "--lock", str(lock)]), 1)
            self.assertEqual(len(source.calls), count)

    def test_real_cli_replays_and_installs_only_offline_fixture_in_temp_directory(self):
        import subprocess
        import sys
        self.stage()
        script = Path(weekly.__file__).resolve()
        replay = subprocess.run([sys.executable, "-B", str(script), "--replay", str(self.root / "stage"),
                                 "--run", str(self.root / "cli-replay")], capture_output=True, text=True, timeout=60)
        self.assertEqual(replay.returncode, 0, replay.stderr)
        self.assertEqual(json.loads(replay.stdout)["requests"], 0)
        install = subprocess.run([sys.executable, "-B", str(script), "--install-from", str(self.root / "cli-replay"),
                                  "--install-to", str(self.root / "cli-live")], capture_output=True, text=True, timeout=20)
        self.assertEqual(install.returncode, 0, install.stderr)
        self.assertEqual(len(json.loads(install.stdout)["changed"]), 4)
        for path in (self.root / "cli-live").glob("*.csv"):
            self.assertEqual(path.read_bytes(), (self.root / "stage/csv" / path.name).read_bytes())

    def test_zero_field_population_is_a_valid_missing_observation_not_a_transport_failure(self):
        class ZeroPopulation(SyntheticTransport):
            def __call__(self, params):
                if params["filter"].endswith("publication_year:2005") and "title_and_abstract.search:" in params["filter"]:
                    return 200, {}, json.dumps({"results": []} if "sample" in params else {"meta": {"count": 0}}).encode()
                return super().__call__(params)
        manifest = self.stage(transport=ZeroPopulation())
        self.assertEqual(manifest["status"], "staged")
        weekly.run(self.root / "zero-replay", current_year=2026, replay=self.root / "stage")
        rows = weekly.read_csv(self.root / "stage/csv/ai-robotics.csv")[2]
        self.assertEqual(rows[0]["field_works"], "0")
        self.assertEqual(rows[0]["idea_vintage_median_years"], "")
        self.assertEqual(rows[0]["n_works_sampled"], "0")


    def _crash_fixture(self):
        self.stage()
        live = self.root / "live"
        live.mkdir()
        weekly.install(self.root / "stage", live)
        self.stage("changed")
        changed = self.root / "changed"
        manifest = json.loads((changed / "manifest.json").read_text())
        for path in (changed / "csv").glob("*.csv"):
            path.write_text(path.read_text().replace(",8,1000,800.0,", ",8,2000,400.0,"))
        manifest["files"] = weekly.validate_set(changed / "csv", 2026)
        (changed / "manifest.json").write_bytes(weekly.encoded(manifest))
        return live, changed

    def test_process_death_before_journal_publication_recovers_without_live_changes(self):
        import os
        live, changed = self._crash_fixture()
        before = {p.name: p.read_bytes() for p in live.glob("*.csv")}
        original = weekly.atomic_write
        pid = os.fork()
        if pid == 0:
            def die_before_journal(path, data):
                if Path(path).name == "journal.json":
                    os._exit(73)
                return original(path, data)
            with patch.object(weekly, "atomic_write", side_effect=die_before_journal):
                weekly.install(changed, live)
            os._exit(0)
        _, status = os.waitpid(pid, 0)
        self.assertEqual(os.waitstatus_to_exitcode(status), 73)
        self.assertEqual(before, {p.name: p.read_bytes() for p in live.glob("*.csv")})
        receipt = weekly.install(changed, live)
        self.assertEqual(len(receipt["changed"]), 4)
        self.assertFalse((live / ".openalex-transaction").exists())
        self.assertFalse((live / ".openalex-preparation").exists())
        for path in live.glob("*.csv"):
            self.assertEqual(path.read_bytes(), (changed / "csv" / path.name).read_bytes())


    def test_process_death_during_committed_cleanup_keeps_new_set_and_recovers(self):
        import os
        live, changed = self._crash_fixture()
        original = weekly.shutil.rmtree
        pid = os.fork()
        if pid == 0:
            def die_during_cleanup(path, *args, **kwargs):
                folder = Path(path)
                backups = list(folder.glob("*.csv"))
                if folder.name.startswith(".openalex-") and backups:
                    backups[0].unlink()
                    os._exit(74)
                return original(path, *args, **kwargs)
            with patch.object(weekly.shutil, "rmtree", side_effect=die_during_cleanup):
                weekly.install(changed, live)
            os._exit(0)
        _, status = os.waitpid(pid, 0)
        self.assertEqual(os.waitstatus_to_exitcode(status), 74)
        for path in live.glob("*.csv"):
            self.assertEqual(path.read_bytes(), (changed / "csv" / path.name).read_bytes())
        receipt = weekly.install(changed, live)
        self.assertEqual(receipt["changed"], [])
        self.assertFalse((live / ".openalex-transaction").exists())
        self.assertFalse((live / ".openalex-completed").exists())


if __name__ == "__main__":
    unittest.main()
