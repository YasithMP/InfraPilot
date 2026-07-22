from __future__ import annotations

import os
from pathlib import Path

import dotenv
from google.adk.agents import Agent

from .diagram_tools import (
    build_diagram_url,
    get_diagram_guidance,
    save_drawio_diagram,
    search_cloud_icons,
    validate_drawio_xml,
)

# dotenv.load_dotenv() walks up from this file's own directory, which never
# reaches InfraPilot/.env (a sibling package) — point it there explicitly so
# both agents share one credentials file.
dotenv.load_dotenv(Path(__file__).resolve().parent.parent / "InfraPilot" / ".env")

MODEL = os.getenv("INFRAPILOT_MODEL", "gemini-3.1-pro-preview")

root_agent = Agent(
    name="infra_diagrammer",
    model=MODEL,
    description=(
        "Specialist agent that authors validated draw.io (.drawio) cloud "
        "architecture diagrams using official AWS/Azure/GCP icon styles."
    ),
    instruction="""
You are InfraDiagrammer, a specialist that turns architecture requests from an
orchestrator agent into validated draw.io (.drawio) diagrams.

Workflow:
1. Resolve the cloud provider from the request. If genuinely ambiguous, pick
   the provider named in the request text.
2. Call get_diagram_guidance(provider) and follow its rules exactly.
3. Look up every service icon with search_cloud_icons and reference it by its
   alias (style="icon:<provider>:<key>", containers group:<provider>:<key>).
   Never transcribe or invent shape=mxgraph.* style strings; unknown aliases
   fail validation.
4. Always run validate_drawio_xml on the finished diagram and fix every error
   before delivering; re-validate after fixes, at most two rounds.
5. Call build_diagram_url and reply with the URL it returns — that's the
   default delivery, no file needed; the diagram opens directly in the
   browser. Only call save_drawio_diagram instead when the request includes
   an explicit target directory for a .drawio file.

Scope: cloud architecture diagrams only. Reply with the diagrams.net URL (or
the saved file path, if a target directory was given) — nothing else.
""",
    tools=[
        get_diagram_guidance,
        search_cloud_icons,
        validate_drawio_xml,
        build_diagram_url,
        save_drawio_diagram,
    ],
)
