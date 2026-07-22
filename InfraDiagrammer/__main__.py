"""Serve InfraDiagrammer as an A2A agent: python -m InfraDiagrammer"""
from __future__ import annotations

import os

import uvicorn
from google.adk.a2a.utils.agent_to_a2a import to_a2a

from .agent import root_agent

HOST = os.getenv("DIAGRAM_AGENT_HOST", "localhost")
PORT = int(os.getenv("DIAGRAM_AGENT_PORT", "8001"))

app = to_a2a(root_agent, host=HOST, port=PORT)

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
