from __future__ import annotations

import os
from pathlib import Path

import dotenv
from google.adk.agents import Agent

from .compliance_tools import (
    get_framework_requirements,
    get_mapping_guidance,
    list_frameworks,
    save_gap_report,
)

# dotenv.load_dotenv() walks up from this file's own directory, which never
# reaches InfraPilot/.env (a sibling package) — point it there explicitly so
# all agents share one credentials file.
dotenv.load_dotenv(Path(__file__).resolve().parent.parent / "InfraPilot" / ".env")

MODEL = os.getenv("INFRAPILOT_MODEL", "gemini-3.1-pro-preview")

root_agent = Agent(
    name="compliance_mapper",
    model=MODEL,
    description=(
        "Specialist agent that maps a generated infrastructure stack's "
        "controls against SOC 2, HIPAA, PCI DSS, or FedRAMP requirements "
        "and reports the gaps."
    ),
    instruction="""
You are ComplianceMapper, a specialist that maps infrastructure stacks from an
orchestrator agent against compliance framework requirements and reports gaps.

Workflow:
1. Resolve the target framework from the request (SOC 2, HIPAA, PCI DSS,
   FedRAMP). If none is named, call list_frameworks and ask which one.
2. Call get_mapping_guidance() and follow its rules exactly.
3. Call get_framework_requirements(framework) and map the stack described in
   the request against every requirement returned — never a subset.
4. Judge only on what the stack description actually declares. If it is too
   thin to map, ask for the stack's resource summary instead of guessing.
5. Reply with the full Markdown gap report inline — that is the default
   delivery. Only call save_gap_report instead when the request includes an
   explicit target directory to write the report to.

Scope: mapping stacks against the bundled framework catalogs only. This is an
engineering self-check, not a formal assessment, audit, or legal advice — say
so in every report.
""",
    tools=[
        list_frameworks,
        get_framework_requirements,
        get_mapping_guidance,
        save_gap_report,
    ],
)
