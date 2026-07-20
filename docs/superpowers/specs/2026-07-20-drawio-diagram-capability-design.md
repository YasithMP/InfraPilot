# Draw.io architecture diagram capability — design

Date: 2026-07-20
Status: approved by user

## Goal

Give the InfraPilot ADK agent the ability to generate draw.io architecture
diagrams (`.drawio` XML) of the cloud stacks it designs, using the exact
official AWS / Azure / GCP icon styles so icons render correctly instead of as
blank boxes.

Inspired by two reference skills:

- `Agents365-ai/drawio-skill` — shape search over the official draw.io shape
  index (never guess a `shape=mxgraph.*` name), XML authoring rules,
  deterministic validation, self-check loop.
- `softaworks/agent-toolkit/skills/draw-io` — curated per-service icon
  catalog, layout rules (container margins, connection-point distribution,
  arrow layering), quality checklist.

## Decisions (from user)

- Icon catalog: **aligned with InfraPilot stacks** (~12–15 services per
  provider matching `STACKS` modules, plus networking/common icons and
  group/container styles for cloud/region/VPC/subnet boxes).
- Export: **XML only** — produce the `.drawio` file; no drawio CLI export, no
  diagrams.net URL fallback. The chat response mentions the file opens in
  draw.io desktop or diagrams.net.
- Scope: **cloud architecture diagrams only** (no flowcharts, UML, etc.).

## Non-goals

- PNG/SVG/PDF export via the draw.io desktop CLI.
- Auto-layout engine (Graphviz or custom). The LLM places coordinates
  following the layout rules; a validator catches mistakes. May be revisited.
- Diagram types other than cloud architecture.
- Wiring the existing `InfraPilot/knowledge/` markdown files into the agent
  (they are currently not loaded by any code; out of scope).

## Architecture

A new module `InfraPilot/diagram_tools.py` provides four ADK function tools,
backed by curated icon catalogs in `InfraPilot/assets/icons/`. The agent
instruction gains a short "Architecture diagrams" section describing the
workflow. Stdlib only — no new dependencies.

```text
User: "draw the architecture for this AWS stack"
  → agent resolves provider (recommend_stack if unclear)
  → get_diagram_guidance(provider)        # rules, on demand
  → search_cloud_icons(provider, query)   # exact style strings, on demand
  → agent authors .drawio XML per the rules
  → validate_drawio_xml(xml)              # deterministic lint
  → fix + re-validate (max 2 rounds)
  → save_drawio_diagram(xml, target_directory)  # only if user gave a path
    else return the XML in chat
```

## Components

### 1. Icon catalogs — `InfraPilot/assets/icons/{aws,azure,gcp,generic}.json`

Curated, verified entries; one JSON object per provider:

```json
{
  "provider": "aws",
  "icons": [
    {
      "key": "lambda_function",
      "name": "AWS Lambda",
      "category": "compute",
      "style": "shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;",
      "width": 78,
      "height": 78
    }
  ],
  "groups": [
    {
      "key": "vpc",
      "name": "VPC",
      "style": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;",
      "width": 400,
      "height": 300
    }
  ]
}
```

- Coverage: every module in `STACKS` for aws/azure/gcp (both Terraform and
  Pulumi naming map to the same cloud services), plus common networking icons
  (load balancer, NAT/Internet gateway, DNS, CDN), generic clients
  (user, internet), and group/container styles (cloud, region, VPC,
  public/private subnet, availability zone / equivalent).
- Style strings are extracted and verified at build time from the official
  draw.io shape data (the same upstream index `drawio-skill` ships), so no
  `mxgraph.*` name is ever guessed. AWS uses `mxgraph.aws4.*`; Azure and GCP
  styles are verified against the index during implementation.
- `InfraPilot/assets/icons/NOTICE.md` attributes the upstream draw.io shape
  data.

### 2. Tools — `InfraPilot/diagram_tools.py`

Mirrors the style of `template_tools.py` (module-level `ICON_ROOT`, small
helpers, `{"status": ...}` dict returns).

- `get_diagram_guidance(provider: str | None = None) -> dict`
  Returns the condensed authoring + layout rules as grounded knowledge,
  loaded on demand instead of bloating the system instruction:
  - XML file skeleton; reserved root cells `0`/`1`; user ids start at `2`.
  - Vertex/edge cell forms; every edge needs a
    `<mxGeometry relative="1" as="geometry" />` child.
  - Semantic color palette (7 colors), grid snapping to multiples of 10,
    spacing table by diagram size, ~80px routing corridors.
  - Container rules (groups/swimlanes, relative child coordinates, 30px+
    inner margins).
  - Connection-point distribution (exitX/entryX spreading for 2+ edges).
  - The diagram workflow (plan → author → validate → fix → deliver).
  - When `provider` is given, adds provider-specific notes (group styles,
    official service naming).

- `search_cloud_icons(provider: Literal["aws","azure","gcp"], query: str = "") -> dict`
  Keyword search over that provider's catalog (case-insensitive substring over
  key/name/category; empty query returns all entries). Returns exact `style`,
  `width`, `height` per match, plus the group styles when they match. Unknown
  provider → error dict listing valid providers. This keeps the full catalog
  out of the model's context — the agent queries only what it needs and must
  never invent a `shape=mxgraph.*` string.

- `validate_drawio_xml(xml: str) -> dict`
  Deterministic stdlib lint returning `{"status", "errors", "warnings"}`:
  - Errors: unparseable XML; missing `mxGraphModel`/`root`; missing root cells
    `0`/`1`; duplicate ids; user cell reusing id `0`/`1`; edge missing its
    geometry child; edge `source`/`target` referencing a non-existent cell;
    vertex missing geometry or non-positive width/height.
  - Warnings: coordinates not snapped to multiples of 10; sibling vertex
    bounding-box overlap (container children excluded); `shape=mxgraph.*`
    style not present in the bundled catalogs (unverified icon).

- `save_drawio_diagram(xml: str, target_directory: str, filename: str = "architecture", overwrite: bool = False) -> dict`
  Validates first (refuses to save when errors exist, returning them for the
  agent to fix); then writes `<target_directory>/<filename>.drawio` using the
  same guarded `_safe_target` pattern as `template_tools.py`: an explicit
  user-supplied directory is required (no default path), existing files are
  skipped unless `overwrite=True`. Returns the written path and validation
  summary.

### 3. Agent wiring — `InfraPilot/agent.py`

- Import and register the four new tools in `root_agent.tools`.
- Add an "Architecture diagrams" section to the instruction:
  resolve the provider first; call `get_diagram_guidance` and
  `search_cloud_icons`; never invent icon styles; always validate and fix
  before delivering; save only to a user-supplied directory, otherwise present
  the XML in a code block and mention it opens in draw.io desktop or
  diagrams.net.

### 4. Tests — `tests/test_diagram_tools.py`

Small pytest module (no tests exist yet; the repo has a pytest cache):

- Each catalog JSON loads; every `STACKS` module for aws/azure/gcp has a
  matching icon key; every style contains `mxgraph.`; ids/keys are unique.
- `validate_drawio_xml` accepts a minimal valid diagram and flags: dangling
  edge, duplicate id, self-closing edge cell, missing root cells.
- `save_drawio_diagram` rejects an empty `target_directory` and skips an
  existing file without `overwrite`.

## Error handling

- Unknown provider / no icon matches → error dict with valid providers/keys.
- Validation errors → returned to the agent, which fixes and re-validates
  (max 2 rounds, then delivers with a note).
- Save without target directory → error: "No target directory was supplied.
  Return the XML in chat." (consistent with the existing scaffold tools).
- Existing destination file → skipped unless `overwrite=True`.

## Data flow

No persistence, no external calls at runtime. Catalog JSONs are bundled
assets read lazily by the tools. The `.drawio` artifact goes only to a
user-supplied path or the chat.

## Security / safety

- Same guarded-write policy as the existing scaffold tools (explicit target,
  no overwrite by default).
- The validator never executes XML content; parsing uses `xml.etree.ElementTree`
  on agent-generated content only.
