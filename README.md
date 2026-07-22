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
- Architecture diagram generation as validated `.drawio` files with official AWS/Azure/GCP icons, delegated to a separate `InfraDiagrammer` specialist agent over A2A
- Compliance gap analysis against SOC 2, HIPAA, PCI DSS, and FedRAMP, delegated to a separate `ComplianceMapper` specialist agent over A2A

## Project structure

```text
.
├── InfraPilot/
│   ├── __init__.py
│   ├── agent.py
│   ├── template_tools.py
│   ├── assets/
│   │   ├── GENOPS_LICENSE
│   │   └── templates/
│   ├── knowledge/
│   └── .env.example
├── InfraDiagrammer/
│   ├── __init__.py
│   ├── agent.py
│   ├── __main__.py
│   ├── diagram_tools.py
│   └── assets/
│       └── icons/
├── .gitignore
├── README.md
└── requirements.txt
```

Local credentials, virtual environments, Python caches, and ADK session data are excluded from Git.

## Prerequisites

- Python 3.10 or newer
- A Google AI Studio API key or a configured Google Cloud project

## Setup

1. Clone the repository and enter its directory.

   ```bash
   git clone <your-repository-url>
   cd devops-agent
   ```

2. Create and activate a virtual environment.

   macOS/Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   Windows PowerShell:

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. Install the dependencies.

   ```bash
   python -m pip install -r requirements.txt
   ```

4. Create your local environment file.

   macOS/Linux:

   ```bash
   cp InfraPilot/.env.example InfraPilot/.env
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item InfraPilot\.env.example InfraPilot\.env
   ```

5. Edit `InfraPilot/.env` and provide either your Google AI Studio API key or your Vertex AI project settings. Never commit this file.

## Run the agents

InfraPilot delegates architecture-diagram requests to a separate `InfraDiagrammer`
specialist agent over the A2A protocol, so two processes run in development.

`make run` starts both with one command: the specialist in the background,
then `adk web` in the foreground, stopping the specialist when `adk web` exits.
`make install` creates `.venv` and installs `requirements.txt` first if needed.

To run them by hand instead:

1. Start the diagram specialist (defaults to `localhost:8001`):

   ```bash
   python -m InfraDiagrammer
   ```

2. In another terminal, with the virtual environment active, start the orchestrator:

   ```bash
   adk web
   ```

Open the local URL printed by ADK and select `InfraPilot`. If `InfraDiagrammer`
isn't running, every other capability still works — only diagram requests fail,
with a message telling you to start it. `DIAGRAM_AGENT_URL` (on the InfraPilot
side) and `DIAGRAM_AGENT_HOST`/`DIAGRAM_AGENT_PORT` (on the InfraDiagrammer
side) override the defaults for a non-local deployment.

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
- `request_architecture_diagram` (an `AgentTool` wrapping ADK's `RemoteA2aAgent`) delegates diagram requests to `InfraDiagrammer` over A2A and relays its reply.

The agent uses these tools as grounded knowledge and copies version-pinned assets instead of spending model tokens regenerating known modules. It writes only to a target directory explicitly supplied by the user. Without one, it returns the proposed files in chat. Existing destination files are skipped unless overwrite is explicitly requested.

[`InfraDiagrammer/agent.py`](InfraDiagrammer/agent.py) is the specialist agent that actually authors diagrams, using [`InfraDiagrammer/diagram_tools.py`](InfraDiagrammer/diagram_tools.py):

- `get_diagram_guidance` returns the draw.io authoring and layout rules.
- `search_cloud_icons` returns exact official AWS/Azure/GCP icon aliases and sizes.
- `validate_drawio_xml` expands icon aliases and lints the diagram structure.
- `save_drawio_diagram` writes a validated `.drawio` file to an explicit user-supplied target.

The LLM never transcribes raw icon styles: it authors XML with short `icon:<provider>:<key>` / `group:<provider>:<key>` alias tokens, which the tools expand deterministically. `InfraDiagrammer/__main__.py` serves the agent over A2A (`python -m InfraDiagrammer`) using ADK's `to_a2a()` under uvicorn.

## Extension ideas

- Add more reviewed, version-pinned IaC templates.
- Add CloudFormation, CDK, and Ansible stack catalogues.
- Add official provider-document retrieval for version upgrades.
- Add automated tests and ADK evaluation cases for the knowledge tools.

## Attribution

InfraPilot's IaC workflow, references, and bundled templates are adapted from [OmerMohideen/genops](https://github.com/OmerMohideen/genops), released under the MIT License. The upstream license is included at `InfraPilot/assets/GENOPS_LICENSE`.

## Security

Keep API keys and cloud credentials only in your local `.env` file or a secure secret manager. If a secret is ever committed, revoke or rotate it before removing it from Git history.
