import os
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from ai_service.main import (
    CompletionRequest,
    Provider,
    app,
    _authorize,
    _call_provider,
    _payload,
    _response_text,
)


class FakeResponse:
    status_code = 200
    is_success = True

    def json(self):
        return {
            "choices": [{
                "message": {"content": '{"ok": true}'},
            }],
        }


class FakeAsyncClient:
    last_request = None

    def __init__(self, **_kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def post(self, url, *, headers, json):
        type(self).last_request = {"url": url, "headers": headers, "json": json}
        return FakeResponse()


class AIServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_service_token_is_required_and_compared(self):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="secret")
        with patch.dict(os.environ, {"PYTHON_AI_SERVICE_TOKEN": "secret"}):
            self.assertIsNone(await _authorize(credentials))

        with patch.dict(os.environ, {"PYTHON_AI_SERVICE_TOKEN": "secret"}):
            with self.assertRaises(HTTPException) as error:
                await _authorize(HTTPAuthorizationCredentials(scheme="Bearer", credentials="wrong"))
        self.assertEqual(error.exception.status_code, 401)

    async def test_openai_key_stays_in_header_and_chat_json_is_returned(self):
        request = CompletionRequest(provider=Provider.OPENAI, prompt="Return JSON.", max_tokens=50)
        with (
            patch.dict(os.environ, {"OPENAI_API_KEY": "server-secret"}, clear=True),
            patch("ai_service.main.httpx.AsyncClient", FakeAsyncClient),
        ):
            content = await _call_provider(request)

        self.assertEqual(content, '{"ok": true}')
        self.assertEqual(FakeAsyncClient.last_request["headers"]["Authorization"], "Bearer server-secret")
        self.assertEqual(FakeAsyncClient.last_request["json"]["max_completion_tokens"], 50)
        self.assertNotIn("server-secret", str(FakeAsyncClient.last_request["json"]))

    def test_request_payload_shapes_for_all_provider_protocols(self):
        openai_payload = _payload("gpt-example", "Prompt", 100, "openai", Provider.OPENAI)
        nvidia_payload = _payload("llama-example", "Prompt", 100, "openai", Provider.NVIDIA)
        gemini_payload = _payload("gemini-example", "Prompt", 100, "gemini", Provider.GEMINI)
        anthropic_payload = _payload("claude-example", "Prompt", 100, "anthropic", Provider.ANTHROPIC)
        ollama_payload = _payload("local-example", "Prompt", 100, "ollama", Provider.OLLAMA)

        self.assertIn("max_completion_tokens", openai_payload)
        self.assertIn("max_tokens", nvidia_payload)
        self.assertEqual(gemini_payload["generationConfig"]["responseMimeType"], "application/json")
        self.assertIsInstance(anthropic_payload["system"], str)
        self.assertNotIn("system", anthropic_payload["messages"][0])
        self.assertFalse(ollama_payload["stream"])
        self.assertEqual(_response_text({"message": {"content": "local"}}, "ollama"), "local")
        self.assertEqual(_response_text({"choices": None}, "openai"), "")

    def test_completion_route_requires_service_token_and_never_accepts_client_keys(self):
        client = TestClient(app)
        with patch.dict(os.environ, {"PYTHON_AI_SERVICE_TOKEN": "service-secret"}):
            unauthorized = client.post(
                "/v1/completions",
                json={"provider": "openai", "prompt": "Prompt"},
            )
            self.assertEqual(unauthorized.status_code, 401)

            with patch("ai_service.main._call_provider", new=AsyncMock(return_value='{"ok":true}')):
                accepted = client.post(
                    "/v1/completions",
                    headers={"Authorization": "Bearer service-secret"},
                    json={"provider": "openai", "prompt": "Prompt"},
                )
                self.assertEqual(accepted.status_code, 200)
                self.assertEqual(accepted.json(), {"content": '{"ok":true}'})

                rejected_key = client.post(
                    "/v1/completions",
                    headers={"Authorization": "Bearer service-secret"},
                    json={"provider": "openai", "prompt": "Prompt", "api_key": "client-secret"},
                )
                self.assertEqual(rejected_key.status_code, 422)


if __name__ == "__main__":
    unittest.main()
