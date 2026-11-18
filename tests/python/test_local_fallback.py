import os
import unittest
from unittest import mock

import httpx
from fastapi.testclient import TestClient

from ai_service import main
from ai_service.quiz_logic import normalize, summarize_locally

NOTES = (
    "Photosynthesis is the process plants use to turn sunlight into chemical energy. "
    "Chlorophyll inside the chloroplasts absorbs sunlight during photosynthesis. "
    "Plants take in carbon dioxide through small openings called stomata. "
    "Water travels from the roots to the leaves through the xylem. "
    "Glucose made during photosynthesis stores energy that the plant uses to grow."
)


class SummarizeLocallyTests(unittest.TestCase):
    def test_builds_overview_only_from_source_sentences(self):
        result = summarize_locally(NOTES)
        source = normalize(NOTES)

        self.assertTrue(result["overview"])
        self.assertIn("### Key details", result["summary"])
        self.assertTrue(result["keyPoints"])
        for item in result["keyPoints"]:
            self.assertIn(normalize(item["quote"]), source)
        for item in result["keyTerms"]:
            self.assertIn(normalize(item["term"]), source)

    def test_rejects_material_without_sentences(self):
        with self.assertRaisesRegex(ValueError, "complete sentences"):
            summarize_locally("too short")


class ProviderFallbackTests(unittest.TestCase):
    def setUp(self):
        main._provider_down_until = 0.0
        self.client = TestClient(main.app)
        patches = [
            mock.patch.object(main, "_authenticate", mock.AsyncMock(return_value=True)),
            mock.patch.object(main, "_consume_quota", mock.AsyncMock()),
            mock.patch.dict(os.environ, {"NVIDIA_API_KEY": "nvapi-test", "AI_API_KEY": ""}),
        ]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.quota = main._consume_quota

    def tearDown(self):
        main._provider_down_until = 0.0

    def post(self, body):
        return self.client.post("/api/quiz", json={**body, "provider": {"id": "nvidia"}})

    def provider_returns(self, status_code):
        response = httpx.Response(status_code, json={"detail": "Authorization failed"})
        return mock.patch.object(httpx.AsyncClient, "post", mock.AsyncMock(return_value=response))

    def test_rejected_key_falls_back_for_every_mode(self):
        requests = {
            "summarize": {"mode": "summarize", "notes": NOTES},
            "generate": {"mode": "generate", "notes": NOTES, "count": 3, "types": ["written", "flashcard"]},
            "grade": {"mode": "grade", "notes": NOTES, "question": "What absorbs sunlight?", "reference": "Chlorophyll absorbs sunlight.", "answer": "chlorophyll absorbs the sunlight"},
        }
        for mode, body in requests.items():
            with self.subTest(mode=mode), self.provider_returns(403):
                main._provider_down_until = 0.0
                response = self.post(body)
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["mode"], "local")
                self.assertIn("unavailable", response.json()["notice"])

    def test_rejected_key_is_skipped_without_spending_quota(self):
        with self.provider_returns(403) as provider:
            self.post({"mode": "summarize", "notes": NOTES})
            self.post({"mode": "summarize", "notes": NOTES})
            self.assertEqual(provider.await_count, 1)
        self.assertEqual(self.quota.await_count, 1)

    def test_missing_key_uses_local_tools(self):
        with mock.patch.dict(os.environ, {"NVIDIA_API_KEY": "", "AI_API_KEY": ""}):
            response = self.post({"mode": "summarize", "notes": NOTES})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["mode"], "local")
        self.quota.assert_not_awaited()

    def test_other_provider_errors_are_still_reported(self):
        with self.provider_returns(500):
            response = self.post({"mode": "summarize", "notes": NOTES})
        self.assertEqual(response.status_code, 502)
        self.assertIn("error", response.json())


if __name__ == "__main__":
    unittest.main()
