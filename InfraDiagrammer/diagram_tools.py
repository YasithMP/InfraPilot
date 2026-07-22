from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
import urllib.parse
from pathlib import Path
from typing import Literal

ICON_ROOT = Path(__file__).resolve().parent / "assets" / "icons"

Provider = Literal["aws", "azure", "gcp", "generic"]

_ALIAS = re.compile(r"(icon|group):([a-z]+):([a-z0-9_]+)")

_ABBREVIATIONS = {
    "alb": "application_load_balancer",
    "nlb": "network_load_balancer",
    "agw": "application_gateway",
    "vm": "virtual_machine",
    "vnet": "virtual_network",
    "nsg": "network_security_group",
    "acr": "container_registry",
}

_catalogs: dict[str, dict] = {}


def _load_catalog(provider: str) -> dict | None:
    if provider not in _catalogs:
        path = ICON_ROOT / f"{provider}.json"
        if not path.is_file():
            return None
        catalog = json.loads(path.read_text(encoding="utf-8"))
        template = catalog.get("icon_template")
        if template:
            for entry in catalog.get("icons", []):
                entry.setdefault("style", template.format(ref=entry["ref"]))
        _catalogs[provider] = catalog
    return _catalogs[provider]


def _catalog_entries(provider: str, kind: str | None = None) -> list[dict]:
    catalog = _load_catalog(provider) or {}
    entries = catalog.get("icons", []) + catalog.get("groups", [])
    if kind:
        entries = [entry for entry in entries if entry.get("kind") == kind]
    return entries


def _valid_providers() -> list[str]:
    return sorted(path.stem for path in ICON_ROOT.glob("*.json"))


def search_cloud_icons(provider: Provider, query: str = "") -> dict:
    """Search the bundled official draw.io icon catalog for a cloud provider.

    Args:
        provider: Cloud provider (aws, azure, gcp) or generic.
        query: Keywords matched against key, name, and category. Empty lists all.
    """
    catalog = _load_catalog(provider)
    if catalog is None:
        return {
            "status": "error",
            "message": f"Unknown icon provider: {provider}.",
            "valid_providers": _valid_providers(),
        }
    terms = [_ABBREVIATIONS.get(term, term) for term in query.lower().split()]
    matches = []
    for entry in catalog.get("icons", []) + catalog.get("groups", []):
        haystack = f"{entry['key']} {entry['name']} {entry.get('category', '')}".lower()
        if all(term in haystack for term in terms):
            matches.append(
                {
                    "alias": entry["alias"],
                    "name": entry["name"],
                    "category": entry.get("category", ""),
                    "kind": entry.get("kind", "icon"),
                    "width": entry["width"],
                    "height": entry["height"],
                }
            )
    return {
        "status": "success",
        "provider": provider,
        "notes": catalog.get("notes", ""),
        "count": len(matches),
        "matches": matches,
        "usage": (
            "Put the alias in the cell style, e.g. style=\"icon:aws:lambda_function\". "
            "Never transcribe or invent shape=mxgraph.* style strings."
        ),
    }


def get_diagram_guidance(provider: str | None = None) -> dict:
    """Return the draw.io architecture-diagram authoring and layout rules.

    Args:
        provider: Optional cloud provider for provider-specific notes.
    """
    result: dict = {"status": "success", "rules": DIAGRAM_RULES}
    if provider:
        catalog = _load_catalog(provider.strip().lower().replace("google", "gcp"))
        if catalog is None:
            return {
                "status": "error",
                "message": f"Unknown provider: {provider}.",
                "valid_providers": _valid_providers(),
            }
        result["provider"] = provider
        result["provider_notes"] = catalog.get("notes", "")
    return result


def _expand_aliases(xml_text: str) -> tuple[str, list[str]]:
    """Replace icon:/group: alias tokens with their exact catalog styles."""
    errors: list[str] = []

    def repl(match: re.Match) -> str:
        kind, provider, key = match.group(1), match.group(2), match.group(3)
        catalog = _load_catalog(provider)
        if catalog is None:
            errors.append(
                f"Unknown icon provider '{provider}' in alias '{match.group(0)}'. "
                f"Valid providers: {_valid_providers()}"
            )
            return match.group(0)
        for entry in _catalog_entries(provider, kind):
            if entry["key"] == key:
                return entry["style"]
        valid = sorted(entry["key"] for entry in _catalog_entries(provider, kind))
        errors.append(
            f"Unknown icon alias '{match.group(0)}'. Valid {provider} {kind} keys: {valid}"
        )
        return match.group(0)

    return _ALIAS.sub(repl, xml_text), errors


def validate_drawio_xml(xml: str) -> dict:
    """Lint .drawio XML: expand icon aliases, then check structure and layout.

    Args:
        xml: The diagram XML authored with icon:<provider>:<key> aliases.
    """
    expanded, errors = _expand_aliases(xml)
    warnings: list[str] = []
    if errors:
        return {"status": "error", "errors": errors, "warnings": warnings}

    try:
        document = ET.fromstring(expanded)
    except ET.ParseError as exc:
        return {
            "status": "error",
            "errors": [
                f"XML does not parse: {exc}. Escape &, <, > in labels and use "
                "&#xa; for line breaks inside value attributes."
            ],
            "warnings": warnings,
        }

    model = document if document.tag == "mxGraphModel" else document.find(".//mxGraphModel")
    if model is None:
        return {"status": "error", "errors": ["Missing mxGraphModel element."], "warnings": warnings}
    root = model.find("root")
    if root is None:
        return {"status": "error", "errors": ["Missing root element inside mxGraphModel."], "warnings": warnings}

    cells = root.findall("mxCell")
    ids = [cell.get("id", "") for cell in cells]
    if "0" not in ids or "1" not in ids:
        errors.append(
            "Missing reserved root cells: the file must contain "
            "<mxCell id=\"0\" /> and <mxCell id=\"1\" parent=\"0\" />."
        )
    seen: set[str] = set()
    duplicates = sorted({cell_id for cell_id in ids if cell_id in seen or seen.add(cell_id)})
    if duplicates:
        errors.append(f"Duplicate cell ids: {duplicates}.")
    id_set = set(ids)

    known_styles = tuple(
        entry["style"]
        for provider in _valid_providers()
        for entry in _catalog_entries(provider)
    )
    boxes: dict[str, list[tuple[str, float, float, float, float, str]]] = {}

    for cell in cells:
        cell_id = cell.get("id", "")
        style = cell.get("style", "") or ""
        is_vertex = cell.get("vertex") == "1"
        is_edge = cell.get("edge") == "1"
        if cell_id in ("0", "1") and (is_vertex or is_edge):
            errors.append("Cell ids 0 and 1 are reserved for the root cells.")
        if is_edge:
            if cell.find("mxGeometry") is None:
                errors.append(
                    f"Edge '{cell_id}' has no <mxGeometry relative=\"1\" as=\"geometry\" /> "
                    "child; self-closing edge cells do not render."
                )
            for endpoint in ("source", "target"):
                ref = cell.get(endpoint)
                if ref and ref not in id_set:
                    errors.append(f"Edge '{cell_id}' has dangling {endpoint}='{ref}' (no such cell).")
        elif is_vertex and cell_id not in ("0", "1"):
            geometry = cell.find("mxGeometry")
            if geometry is None:
                errors.append(f"Vertex '{cell_id}' has no mxGeometry.")
                continue
            try:
                x = float(geometry.get("x", 0) or 0)
                y = float(geometry.get("y", 0) or 0)
                width = float(geometry.get("width", 0) or 0)
                height = float(geometry.get("height", 0) or 0)
            except ValueError:
                errors.append(f"Vertex '{cell_id}' has non-numeric geometry.")
                continue
            if width <= 0 or height <= 0:
                errors.append(f"Vertex '{cell_id}' has non-positive width/height ({width:g}x{height:g}).")
            for label, value in (("x", x), ("y", y), ("width", width), ("height", height)):
                if value % 10:
                    warnings.append(f"Cell '{cell_id}' {label}={value:g} is not snapped to a multiple of 10.")
            if "shape=mxgraph." in style and not any(style.startswith(known) for known in known_styles):
                warnings.append(
                    f"Cell '{cell_id}' uses an unverified hand-written mxgraph shape; "
                    "use an icon:<provider>:<key> alias from search_cloud_icons instead."
                )
            boxes.setdefault(cell.get("parent", "1"), []).append((cell_id, x, y, width, height, style))

    for siblings in boxes.values():
        for i in range(len(siblings)):
            for j in range(i + 1, len(siblings)):
                a, b = siblings[i], siblings[j]
                if a[5].startswith("text;") or b[5].startswith("text;"):
                    continue
                if a[1] < b[1] + b[3] and b[1] < a[1] + a[3] and a[2] < b[2] + b[4] and b[2] < a[2] + a[4]:
                    warnings.append(f"Cells '{a[0]}' and '{b[0]}' overlap; move them apart (20px minimum gap).")

    return {
        "status": "error" if errors else "success",
        "errors": errors,
        "warnings": warnings,
    }


def _safe_target(target_directory: str) -> Path:
    if not target_directory.strip():
        raise ValueError(
            "No target directory was supplied. Use build_diagram_url instead."
        )
    return Path(target_directory).expanduser().resolve()


DIAGRAMS_NET_BASE = "https://app.diagrams.net/#R"
# Safe well under browsers' practical URL limits (Chrome/Firefox ~64k+,
# IE/old Edge ~2083); flag anything that risks breaking on older clients.
URL_LENGTH_WARNING_THRESHOLD = 8000


def build_diagram_url(xml: str) -> dict:
    """Validate a diagram and encode it as a shareable diagrams.net URL.

    Args:
        xml: The diagram XML authored with icon:<provider>:<key> aliases.
    """
    validation = validate_drawio_xml(xml)
    if validation["status"] == "error":
        return {
            "status": "error",
            "message": "Diagram did not validate; fix the errors and retry.",
            "errors": validation["errors"],
        }
    expanded, _ = _expand_aliases(xml)
    url = DIAGRAMS_NET_BASE + urllib.parse.quote(expanded, safe="")
    warnings = list(validation["warnings"])
    if len(url) > URL_LENGTH_WARNING_THRESHOLD:
        warnings.append(
            f"URL is {len(url)} characters; some browsers or link-sharing "
            "tools truncate very long URLs. If it doesn't open, use "
            "save_drawio_diagram with a target directory instead."
        )
    return {"status": "success", "url": url, "warnings": warnings}


def save_drawio_diagram(
    xml: str,
    target_directory: str,
    filename: str = "architecture",
    overwrite: bool = False,
) -> dict:
    """Validate a diagram and write the expanded .drawio file to a guarded path.

    Args:
        xml: The diagram XML authored with icon:<provider>:<key> aliases.
        target_directory: Explicit project path supplied by the user.
        filename: Base name for the file (extension added automatically).
        overwrite: Whether an existing file may be replaced.
    """
    validation = validate_drawio_xml(xml)
    if validation["status"] == "error":
        return {
            "status": "error",
            "message": "Diagram did not validate; fix the errors and retry.",
            "errors": validation["errors"],
        }
    try:
        project_root = _safe_target(target_directory)
    except ValueError as exc:
        return {"status": "error", "message": str(exc)}
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", filename).strip("_") or "architecture"
    destination = project_root / f"{safe_name}.drawio"
    if destination.exists() and not overwrite:
        return {
            "status": "skipped",
            "message": f"File exists and overwrite=False: {destination}",
            "path": str(destination),
        }
    destination.parent.mkdir(parents=True, exist_ok=True)
    expanded, _ = _expand_aliases(xml)
    destination.write_text(expanded, encoding="utf-8")
    return {
        "status": "success",
        "path": str(destination),
        "warnings": validation["warnings"],
        "next_steps": [
            "Open the file in draw.io desktop or https://app.diagrams.net to view or export it.",
        ],
    }


DIAGRAM_RULES = """# draw.io architecture diagram rules

## Workflow
1. Plan the diagram: pick the services, group them into containers (cloud,
   region/account/project, VPC/VNet, subnets), and decide the layout direction
   (left-to-right: clients -> edge -> compute -> data).
2. Look up every service icon with search_cloud_icons; reference it by alias.
3. Author the .drawio XML below, then call validate_drawio_xml and fix every
   error (re-validate after fixes, at most two rounds).
4. Deliver via build_diagram_url by default — it returns a diagrams.net URL
   that opens the diagram directly in the browser, no file needed. Only call
   save_drawio_diagram instead when the user explicitly supplied a target
   directory to write a .drawio file to.

## Icons by alias - never transcribe styles
- Service icon: style="icon:<provider>:<key>", e.g. icon:aws:lambda_function.
- Container: style="group:<provider>:<key>", e.g. group:aws:vpc.
- Use the catalog width/height from search_cloud_icons for the mxGeometry.
- NEVER hand-write shape=mxgraph.* styles; a wrong name renders as a blank
  box and fails validation. For anything without an alias, use the plain
  shapes below.

## File skeleton
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio">
  <diagram name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- user cells start at id="2"; ids must be unique -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
- Cells 0 and 1 are mandatory and reserved; never reuse them.
- Multi-line labels: use &#xa; inside the value attribute, not literal newlines.
- Escape &, <, > in labels.

## Vertices
<mxCell id="2" value="AWS Lambda" style="icon:aws:lambda_function" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="60" height="60" as="geometry" />
</mxCell>
Plain shapes (no alias needed): rounded=1 (service), ellipse, rhombus
(decision), shape=cylinder3 (database), shape=cloud (internet), text (labels).
Always add whiteSpace=wrap;html=1; to plain shapes.

## Containers
- AWS: use the group:aws:* aliases (aws_cloud, region, vpc, availability_zone,
  public_subnet, private_subnet, account, security_group).
- Azure/GCP: use group:azure:* / group:gcp:* dashed containers.
- Children set parent="<container id>" and use coordinates RELATIVE to the
  container's top-left corner.
- Keep >= 30px between child edges and the container border; keep the title
  band (top ~30px) clear of children.

## Edges - the number-one failure mode
Every edge MUST have an mxGeometry child; a self-closing edge cell does not
render:
<mxCell id="10" value="HTTPS" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;labelBackgroundColor=#ffffff;fontSize=11;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
- When a node has 2+ connections on one side, spread them with
  exitX/exitY/entryX/entryY (e.g. exitX=0.25/0.5/0.75).
- Route around unrelated shapes with <Array as="points"><mxPoint .../></Array>.

## Color palette (plain shapes only; icons carry their own colors)
blue #dae8fc/#6c8ebf services | green #d5e8d4/#82b366 data | yellow
#fff2cc/#d6b656 queues | orange #ffe6cc/#d79b00 gateways | red #f8cecc/#b85450
errors | grey #f5f5f5/#666666 external | purple #e1d5e7/#9673a6 security

## Layout
- Snap every x/y/width/height to multiples of 10.
- Spacing: <=5 nodes: 200px horizontal / 150px vertical; 6-10: 280/200;
  >10: 350/250. Leave ~80px corridors between bands for edge routing.
- Place hub services (load balancer, message queue) centrally so edges
  radiate; do not route edges through unrelated shapes.
- Label every element; use official service names (Amazon EC2, AWS Lambda,
  Amazon S3, Azure App Service, Cloud Run). No decorative extras.
"""
