"""Serve ComplianceMapper as an A2A agent: python -m ComplianceMapper"""
from __future__ import annotations

import os

import uvicorn
from google.adk.a2a.utils.agent_to_a2a import to_a2a

from .agent import root_agent

HOST = os.getenv("COMPLIANCE_AGENT_HOST", "localhost")
PORT = int(os.getenv("COMPLIANCE_AGENT_PORT", "8002"))

app = to_a2a(root_agent, host=HOST, port=PORT)

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
