"""Offline-only tests: synthetic fixtures/sentinel, never credentials or live API."""
import contextlib
import io
import json
import csv
import tempfile
from pathlib import Path
from email.message import Message
import traceback
import unittest
import urllib.error
from unittest.mock import patch

from scripts.velocity import field_velocity_openalex as refresh

# Intentionally fake; not a credential. No environment credentials are read.
SENTINEL = "SYNTHETIC_TEST_SECRET_NEVER_A_REAL_KEY"


def http_error(code, body="", headers=None):
    message = Message()
    for key, value in (headers or {}).items():
        message[key] = value
    return urllib.error.HTTPError(
        "https://example.invalid/?api_key=" + SENTINEL,
        code, "unsafe reason " + SENTINEL, message,
        io.BytesIO(body.encode()),
    )


class RefreshTests(unittest.TestCase):
    def setUp(self):
        # Every test intercepts the transport, so accidental network use fails.
        self.transport = self.enterContext(patch.object(
            refresh.urllib.request, "urlopen", side_effect=AssertionError("unconfigured offline transport")
        ))
        self.sleep = self.enterContext(patch.object(refresh.time, "sleep"))
        self.stderr = self.enterContext(contextlib.redirect_stderr(io.StringIO()))

    def test_daily_quota_and_permanent_http_errors_fail_fast_safely(self):
        for code, body in [
            (429, json.dumps({"error": "Daily rate limit exceeded", "message": SENTINEL})),
            (429, json.dumps({"error": "Daily budget exceeded", "message": SENTINEL})),
            (401, SENTINEL), (403, SENTINEL), (400, SENTINEL),
        ]:
            with self.subTest(code=code, body=body):
                self.transport.reset_mock()
                self.sleep.reset_mock()
                self.transport.side_effect = http_error(code, body, {"Retry-After": "86400"})
                try:
                    refresh.fetch({"filter": SENTINEL}, SENTINEL, SENTINEL)
                except Exception as error:
                    diagnostic = str(error) + traceback.format_exc() + self.stderr.getvalue()
                else:
                    self.fail("HTTP failure must propagate")
                self.assertNotIn(SENTINEL, diagnostic)
                self.assertEqual(self.transport.call_count, 1)
                self.sleep.assert_not_called()
                self.assertIn("OpenAlex", diagnostic)

    def test_transient_retry_after_numeric_date_and_invalid_are_bounded(self):
        cases = [("3", 4), ("Wed, 21 Oct 2015 07:28:00 GMT", 11),
                 ("bad " + SENTINEL, 2), ("nan", 2), ("inf", 2), ("-9", 2),
                 ("999999", 120), (None, 2)]
        for header, expected in cases:
            with self.subTest(header=header):
                self.transport.reset_mock()
                self.sleep.reset_mock()
                self.transport.side_effect = [
                    http_error(503, headers={"Retry-After": header} if header else {}),
                    io.BytesIO(b'{"meta":{"count":7}}'),
                ]
                with patch.object(refresh.time, "time", return_value=1445412470):
                    self.assertEqual(refresh.fetch({}, "", SENTINEL), {"meta": {"count": 7}})
                self.assertEqual(self.transport.call_count, 2)
                self.sleep.assert_called_once_with(expected)
                self.assertNotIn(SENTINEL, self.stderr.getvalue())

    def test_transient_exhaustion_has_no_final_sleep(self):
        self.transport.side_effect = [http_error(429) for _ in range(3)]
        with self.assertRaisesRegex(RuntimeError, "after 3 attempts"):
            refresh.fetch({}, "", SENTINEL, tries=3)
        self.assertEqual(self.transport.call_count, 3)
        self.assertEqual([call.args[0] for call in self.sleep.call_args_list], [2, 4])

    def fixture_responses(self):
        # Made-up TEST DATA only; never written under src/data.
        payloads = [
            {"meta": {"count": 100}}, {"meta": {"count": 2}},
            {"results": [{"id": "W1", "referenced_works": ["W10", "W10"]}]},
            {"results": [{"id": "W10", "publication_year": 2010}]},
        ]
        return [io.BytesIO(json.dumps(payload).encode()) for payload in payloads]

    def run_cli(self, out, to_year="2020"):
        args = ["refresh", "--search", "OFFLINE TEST FIXTURE", "--from-year", "2020",
                "--to-year", to_year, "--reliable-cutoff-year", "2021",
                "--works-per-year", "80", "--max-refs-per-work", "50",
                "--email", "test@example.invalid", "--api-key", SENTINEL, "--out", str(out)]
        # Replace the mapping, not patch.dict: don't read/copy any real environment.
        with patch.object(refresh.os, "environ", {}), patch.object(refresh.sys, "argv", args):
            refresh.main()

    def test_late_request_failure_preserves_existing_csv(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "fixture.csv"
            out.write_bytes(b"previous CSV bytes\n")
            self.transport.side_effect = self.fixture_responses() + [
                http_error(429, '{"error":"Daily quota exhausted"}')]
            with self.assertRaisesRegex(RuntimeError, "daily quota"):
                self.run_cli(out, to_year="2021")
            self.assertEqual(out.read_bytes(), b"previous CSV bytes\n")
            self.assertEqual(list(Path(directory).iterdir()), [out])
            self.assertNotIn(SENTINEL, self.stderr.getvalue())

    def test_success_replaces_atomically_with_only_fixture_data(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "fixture.csv"
            out.write_text("old data")
            self.transport.side_effect = self.fixture_responses()
            replace = refresh.os.replace
            def inspect_replace(source, target):
                self.assertEqual(Path(source).parent, out.parent)
                self.assertEqual(Path(target), out)
                self.assertEqual(out.read_text(), "old data")
                self.assertIn("OFFLINE TEST FIXTURE", Path(source).read_text())
                replace(source, target)
            with patch.object(refresh.os, "replace", side_effect=inspect_replace) as atomic:
                self.run_cli(out)
                atomic.assert_called_once()
            text = out.read_text()
            self.assertNotIn(SENTINEL, text + self.stderr.getvalue())
            self.assertIn("works_per_year=80; max_refs_per_work=50", text)
            rows = list(csv.DictReader(line for line in text.splitlines() if not line.startswith("#")))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0], dict(zip(
                "year field_works all_works corpus_share_per_100k first_time_authors idea_vintage_median_years vintage_ci_lo vintage_ci_hi n_refs_sampled n_works_sampled reliable".split(),
                ["2020", "2", "100", "2000.0", "", "10", "", "", "1", "1", "1"])))
            self.assertEqual(list(Path(directory).iterdir()), [out])

    def test_failed_atomic_replace_preserves_existing_csv_and_cleans_temp(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "fixture.csv"
            out.write_text("old data")
            self.transport.side_effect = self.fixture_responses()
            with patch.object(refresh.os, "replace", side_effect=OSError("test disk failure")):
                with self.assertRaises(OSError):
                    self.run_cli(out)
            self.assertEqual(out.read_text(), "old data")
            self.assertEqual(list(Path(directory).iterdir()), [out])

    def test_nested_transport_exception_never_exposes_secret(self):
        def broken_transport(*args, **kwargs):
            try:
                raise ValueError("nested " + SENTINEL)
            except ValueError as inner:
                raise urllib.error.URLError("https://example.invalid/" + SENTINEL) from inner
        self.transport.side_effect = broken_transport
        try:
            refresh.fetch({"filter": SENTINEL}, SENTINEL, SENTINEL, tries=2)
        except Exception as error:
            diagnostic = str(error) + traceback.format_exc() + self.stderr.getvalue()
        else:
            self.fail("transport failure must propagate")
        self.assertNotIn(SENTINEL, diagnostic)
        self.assertNotIn("https://example.invalid", diagnostic)
        self.assertNotIn("api_key=", diagnostic)
        self.assertEqual(self.transport.call_count, 2)
        self.assertEqual(self.sleep.call_count, 1)


if __name__ == "__main__":
    unittest.main()
