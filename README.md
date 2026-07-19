# InfraPilot

InfraPilot is a [Google Agent Development Kit (ADK)](https://google.github.io/adk-docs/) infrastructure-as-code agent based on the knowledge and workflow of the open-source [GenOps skill](https://github.com/OmerMohideen/genops). It helps design Terraform, OpenTofu, Pulumi, and Bicep stacks for AWS, Azure, and Google Cloud.

## Features

- A single ADK agent with a clear `root_agent` entry point
- IaC stack recommendations based on explicit tool and cloud requirements
- Version pins and module catalogues for supported stacks
- 231 bundled IaC and CI/CD template files copied from GenOps
- Guarded template scaffolding that skips existing files by default
- Environment isolation, state, secrets, naming, and layout guidance
- GitHub Actions, Azure DevOps, and Jenkins pipeline guidance
- Enterprise security, governance, and migration knowledge

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

## Run the agent

From the repository root, with the virtual environment active, run:

```bash
adk web
```

Open the local URL printed by ADK and select `InfraPilot`.

## Example prompts

- “Create a production-ready Azure web app with Terraform.”
- “Design an AWS VPC, private EC2 service, and RDS database with OpenTofu.”
- “Scaffold a GCP Cloud Run service with Pulumi and GitHub Actions.”
- “Which modules and versions do you support for Terraform on AWS?”
- “Add enterprise security defaults and drift detection to this design.”
- “Plan a safe Terraform-to-Pulumi migration.”

## How it works

[`InfraPilot/agent.py`](InfraPilot/agent.py) defines the stack knowledge, nine function tools, and the ADK agent:

- `list_supported_stacks` returns the supported tool/provider/version matrix.
- `recommend_stack` resolves tool and cloud choices from a request.
- `get_stack_guidance` returns modules, layout, state, variables, and authentication guidance.
- `get_cicd_guidance` returns platform-specific validation and deployment rules.
- `get_enterprise_requirements` returns mandatory production hardening controls.
- `get_migration_guidance` returns safe upgrade and cross-tool migration steps.
- `list_template_files` discovers bundled assets without loading their contents.
- `scaffold_iac_template` copies a selected IaC stack to an explicit user-supplied target.
- `scaffold_cicd_template` copies matching pipeline files to an explicit user-supplied target.

The agent uses these tools as grounded knowledge and copies version-pinned assets instead of spending model tokens regenerating known modules. It writes only to a target directory explicitly supplied by the user. Without one, it returns the proposed files in chat. Existing destination files are skipped unless overwrite is explicitly requested.

## Extension ideas

- Add more reviewed, version-pinned IaC templates.
- Add CloudFormation, CDK, and Ansible stack catalogues.
- Add official provider-document retrieval for version upgrades.
- Add automated tests and ADK evaluation cases for the knowledge tools.

## Attribution

InfraPilot's IaC workflow, references, and bundled templates are adapted from [OmerMohideen/genops](https://github.com/OmerMohideen/genops), released under the MIT License. The upstream license is included at `InfraPilot/assets/GENOPS_LICENSE`.

## Security

Keep API keys and cloud credentials only in your local `.env` file or a secure secret manager. If a secret is ever committed, revoke or rotate it before removing it from Git history.
