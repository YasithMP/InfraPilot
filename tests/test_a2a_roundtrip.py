"""Live A2A round-trip: InfraPilot delegates to a real InfraDiagrammer server.

Skipped automatically unless Google credentials are configured, since it
drives both agents' LLMs for real.
"""
from __future__ import annotations

import asyncio
import os
import socket
import threading
import time

import pytest

pytest.importorskip("google.adk")

HAS_CREDENTIALS = bool(
    os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_GENAI_USE_VERTEXAI")
)

pytestmark = pytest.mark.skipif(
    not HAS_CREDENTIALS,
    reason="requires GOOGLE_API_KEY or Vertex AI credentials to drive real LLM calls",
)


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("localhost", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="module")
def diagram_agent_url():
    import uvicorn
    from google.adk.a2a.utils.agent_to_a2a import to_a2a

    from InfraDiagrammer.agent import root_agent as diagrammer_agent

    port = _free_port()
    app = to_a2a(diagrammer_agent, host="localhost", port=port)
    config = uvicorn.Config(app, host="localhost", port=port, log_level="warning")
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    for _ in range(50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("localhost", port)) == 0:
                break
        time.sleep(0.1)
    else:
        raise RuntimeError("InfraDiagrammer test server did not start")

    yield f"http://localhost:{port}"

    server.should_exit = True
    thread.join(timeout=5)


def test_infrapilot_delegates_a_diagram_request_over_a2a(diagram_agent_url, monkeypatch):
    monkeypatch.setenv("DIAGRAM_AGENT_URL", diagram_agent_url)

    from google.adk.runners import InMemoryRunner

    from InfraPilot.agent import root_agent as pilot_agent

    async def _run():
        runner = InMemoryRunner(agent=pilot_agent)
        return await runner.run_debug(
            "Draw an AWS architecture diagram with a Lambda function reading "
            "from an S3 bucket.",
            quiet=True,
        )

    events = asyncio.run(_run())

    reply = "".join(
        part.text
        for event in events
        for part in (event.content.parts if event.content else [])
        if getattr(part, "text", None)
    )
    assert reply.strip()
    assert "app.diagrams.net" in reply
