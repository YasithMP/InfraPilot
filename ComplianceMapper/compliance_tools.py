from __future__ import annotations

import json
import re
from pathlib import Path

FRAMEWORK_ROOT = Path(__file__).resolve().parent / "assets" / "frameworks"

_ALIASES = {
    "soc 2": "soc2",
    "soc-2": "soc2",
    "soc2 type 2": "soc2",
    "soc2 type ii": "soc2",
    "pci": "pci_dss",
    "pci dss": "pci_dss",
    "pci-dss": "pci_dss",
    "hipaa security rule": "hipaa",
    "fedramp moderate": "fedramp",
    "nist 800-53": "fedramp",
}

_catalogs: dict[str, dict] = {}


def _normalize(framework: str) -> str:
    key = framework.strip().lower()
    return _ALIASES.get(key, key.replace("-", "_").replace(" ", "_"))


def _load_catalog(framework: str) -> dict | None:
    key = _normalize(framework)
    if key not in _catalogs:
        path = FRAMEWORK_ROOT / f"{key}.json"
        if not path.is_file():
            return None
        _catalogs[key] = json.loads(path.read_text(encoding="utf-8"))
    return _catalogs[key]


def _valid_frameworks() -> list[str]:
    return sorted(path.stem for path in FRAMEWORK_ROOT.glob("*.json"))


def list_frameworks() -> dict:
    """List the compliance frameworks bundled with ComplianceMapper."""
    frameworks = []
    for key in _valid_frameworks():
        catalog = _load_catalog(key) or {}
        frameworks.append(
            {
                "framework": key,
                "name": catalog.get("name", key),
                "version": catalog.get("version", ""),
                "requirement_count": len(catalog.get("requirements", [])),
            }
        )
    return {"status": "success", "frameworks": frameworks}


def get_framework_requirements(framework: str, query: str = "") -> dict:
    """Return the infra-relevant requirements catalog for a compliance framework.

    Args:
        framework: Framework key or common name (soc2, hipaa, pci_dss, fedramp).
        query: Keywords matched against id, name, description, and infra
            signals. Empty returns every requirement.
    """
    catalog = _load_catalog(framework)
    if catalog is None:
        return {
            "status": "error",
            "message": f"Unknown framework: {framework}.",
            "valid_frameworks": _valid_frameworks(),
        }
    terms = query.lower().split()
    matches = []
    for entry in catalog.get("requirements", []):
        haystack = " ".join(
            [entry["id"], entry["name"], entry["description"], *entry.get("infra_signals", [])]
        ).lower()
        if all(term in haystack for term in terms):
            matches.append(entry)
    return {
        "status": "success",
        "framework": catalog["framework"],
        "name": catalog.get("name", ""),
        "version": catalog.get("version", ""),
        "notes": catalog.get("notes", ""),
        "count": len(matches),
        "requirements": matches,
    }


def get_mapping_guidance() -> dict:
    """Return the rules for mapping a stack against a framework and reporting gaps."""
    return {"status": "success", "rules": MAPPING_RULES}


def save_gap_report(
    markdown: str,
    target_directory: str,
    filename: str = "compliance-gap-report",
    overwrite: bool = False,
) -> dict:
    """Write a finished gap report as a Markdown file to a user-supplied path.

    Args:
        markdown: The complete gap report in Markdown.
        target_directory: Explicit project path supplied by the user.
        filename: Base name for the file (extension added automatically).
        overwrite: Whether an existing file may be replaced.
    """
    if not target_directory.strip():
        return {
            "status": "error",
            "message": "No target directory was supplied. Reply with the report inline instead.",
        }
    project_root = Path(target_directory).expanduser().resolve()
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", filename).strip("_") or "compliance-gap-report"
    destination = project_root / f"{safe_name}.md"
    if destination.exists() and not overwrite:
        return {
            "status": "skipped",
            "message": f"File exists and overwrite=False: {destination}",
            "path": str(destination),
        }
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(markdown, encoding="utf-8")
    return {"status": "success", "path": str(destination)}


MAPPING_RULES = """# Compliance mapping rules

## Workflow
1. Resolve the target framework; call get_framework_requirements(framework)
   and map against EVERY returned requirement — no skipping.
2. For each requirement, look for its infra_signals in the stack description
   (resources, modules, settings). Judge on what the stack actually declares,
   not on what could be added.
3. Assign exactly one status per requirement:
   - satisfied: the stack declares controls that clearly address it.
   - partial: some signals present, but a material piece is missing (name it).
   - gap: nothing in the stack addresses it.
   - inherited: met by the cloud provider under the shared-responsibility
     model (physical security, hypervisor); say so explicitly.
   - organizational: a policy/process control that IaC cannot evidence;
     flag it for the customer's compliance owner instead of calling it a gap.
   - unknown: the stack description lacks the detail to judge; say what
     information is needed.
4. Never invent resources that the description does not mention. If the
   description is too thin to map (no resource list, no settings), reply
   asking for the generated stack's resource summary instead of guessing.

## Report format (Markdown)
# <Framework name> gap report — <stack one-liner>
## Summary
One short paragraph plus counts: X satisfied / X partial / X gap /
X inherited / X organizational / X unknown.
## Findings
A table: Requirement | Status | Evidence in stack | Gap / action.
Order: gaps first, then partial, then the rest.
## Top remediations
Numbered list, most material first, each with the concrete IaC-level change
(e.g. "enable CloudTrail org trail with S3 object lock", not "improve logging").

## Tone
- Blunt about gaps; no auditor hedging beyond the standard disclaimer.
- Always end with: this is an engineering self-check against an
  infra-relevant subset of the framework, not a formal assessment or audit.
"""
