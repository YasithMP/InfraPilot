# InfraPilot

InfraPilot is a [Google Agent Development Kit (ADK)](https://google.github.io/adk-docs/) infrastructure-as-code agent based on the knowledge and workflow of the open-source [GenOps skill](https://github.com/OmerMohideen/genops). It helps design Terraform, OpenTofu, Pulumi, and Bicep stacks for AWS, Azure, and Google Cloud.

## Features

- An ADK orchestrator agent (`InfraPilot`) with a clear `root_agent` entry point
- IaC stack recommendations based on explicit tool and cloud requirements
- Version pins and module catalogues for supported stacks
- 231 bundled IaC and CI/CD template files copied from GenOps
- Guarded template scaffolding that skips existing files by default
- Environment isolation, state, secrets, naming, and layout guidance
- GitHub Actions, Azure DevOps, and Jenkins pipeline guidance
- Enterprise security, governance, and migration knowledge
- Architecture diagram generation as validated `.drawio` files with official AWS/Azure/GCP icons, via an in-process `InfraDiagrammer` specialist agent
- Compliance gap analysis against SOC 2, HIPAA, PCI DSS, and FedRAMP, via an in-process `ComplianceMapper` specialist agent
- Installable as a single `infrapilot` CLI command (`pip install -e .`) — no separate servers to run

## Project structure

```text
.
├── InfraPilot/
│   ├── __init__.py
│   ├── agent.py
│   ├── config.py
│   ├── template_tools.py
│   ├── assets/
│   │   ├── GENOPS_LICENSE
│   │   └── templates/
│   ├── knowledge/
│   └── .env.example
├── InfraDiagrammer/
│   ├── __init__.py
│   ├── agent.py
│   ├── diagram_tools.py
│   └── assets/
│       └── icons/
├── ComplianceMapper/
│   ├── __init__.py
│   ├── agent.py
│   ├── compliance_tools.py
│   └── assets/
│       └── frameworks/
├── cli.py
├── tui.py
├── pyproject.toml
├── .gitignore
├── README.md
└── requirements.txt
```

Credentials live in `~/.infrapilot/.env` (per-user, outside the repo), not
inside any of these folders. Virtual environments, Python caches, and ADK
session data are excluded from Git.

## Prerequisites

- Python 3.10 or newer
- A Google AI Studio API key ([get one here](https://aistudio.google.com/apikey)) or a configured Google Cloud project

## Install

```bash
git clone <your-repository-url>
cd InfraPilot
python -m venv .venv
.venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -e .
```

That installs the `infrapilot` command into your virtual environment's `PATH`
via `pyproject.toml`'s `[project.scripts]` entry point.

## Run it

```bash
infrapilot
```

Opens a full-screen [Textual](https://textual.textualize.io/) app: a scrolling
conversation pane, a pinned multi-line input bar (Enter to send, Shift+Enter
for a newline), a live status line while the model is working, and a footer
with model/token usage — the same shape as Claude Code, Codex CLI, and Copilot
CLI. Set up credentials first — copy `InfraPilot/.env.example` to
`~/.infrapilot/.env` and fill it in, or export `GOOGLE_API_KEY`/Vertex AI
settings in your shell.

Pass a one-off request instead of chatting: `infrapilot "list supported stacks"`.
One-shot mode stays plain-console output (no full-screen app) so it's still
pipeable/scriptable.

`InfraDiagrammer` and `ComplianceMapper` run in-process as ordinary tool calls —
one command, one process, nothing else to start.

Prefer ADK's own dev tooling? `make cli` (`adk run InfraPilot`) and `make web`
(`adk web`, browser UI) both work directly against the same agent.

## Example prompts

- “Create a production-ready Azure web app with Terraform.”
- “Design an AWS VPC, private EC2 service, and RDS database with OpenTofu.”
- “Scaffold a GCP Cloud Run service with Pulumi and GitHub Actions.”
- “Which modules and versions do you support for Terraform on AWS?”
- “Add enterprise security defaults and drift detection to this design.”
- “Plan a safe Terraform-to-Pulumi migration.”
- “Draw the architecture of that AWS stack as a draw.io diagram.”

## How it works

[`InfraPilot/agent.py`](InfraPilot/agent.py) defines the stack knowledge, nine function tools, and the ADK orchestrator agent:

- `list_supported_stacks` returns the supported tool/provider/version matrix.
- `recommend_stack` resolves tool and cloud choices from a request.
- `get_stack_guidance` returns modules, layout, state, variables, and authentication guidance.
- `get_cicd_guidance` returns platform-specific validation and deployment rules.
- `get_enterprise_requirements` returns mandatory production hardening controls.
- `get_migration_guidance` returns safe upgrade and cross-tool migration steps.
- `list_template_files` discovers bundled assets without loading their contents.
- `scaffold_iac_template` copies a selected IaC stack to an explicit user-supplied target.
- `scaffold_cicd_template` copies matching pipeline files to an explicit user-supplied target.
- `request_architecture_diagram` / `request_compliance_mapping` (`AgentTool`s wrapping the specialists' `root_agent`s directly, in-process) delegate to `InfraDiagrammer`/`ComplianceMapper` and relay their reply.

The agent uses these tools as grounded knowledge and copies version-pinned assets instead of spending model tokens regenerating known modules. It writes only to a target directory explicitly supplied by the user. Without one, it returns the proposed files in chat. Existing destination files are skipped unless overwrite is explicitly requested.

[`InfraDiagrammer/agent.py`](InfraDiagrammer/agent.py) is the specialist agent that actually authors diagrams, using [`InfraDiagrammer/diagram_tools.py`](InfraDiagrammer/diagram_tools.py):

- `get_diagram_guidance` returns the draw.io authoring and layout rules.
- `search_cloud_icons` returns exact official AWS/Azure/GCP icon aliases and sizes.
- `validate_drawio_xml` expands icon aliases and lints the diagram structure.
- `save_drawio_diagram` writes a validated `.drawio` file to an explicit user-supplied target.

The LLM never transcribes raw icon styles: it authors XML with short `icon:<provider>:<key>` / `group:<provider>:<key>` alias tokens, which the tools expand deterministically.

## Extension ideas

- Add more reviewed, version-pinned IaC templates.
- Add CloudFormation, CDK, and Ansible stack catalogues.
- Add official provider-document retrieval for version upgrades.
- Add automated tests and ADK evaluation cases for the knowledge tools.

## Attribution

InfraPilot's IaC workflow, references, and bundled templates are adapted from [OmerMohideen/genops](https://github.com/OmerMohideen/genops), released under the MIT License. The upstream license is included at `InfraPilot/assets/GENOPS_LICENSE`.

## Security

Keep API keys and cloud credentials only in your local `.env` file or a secure secret manager. If a secret is ever committed, revoke or rotate it before removing it from Git history.
