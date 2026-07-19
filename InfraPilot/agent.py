from __future__ import annotations

import os
from typing import Literal

import dotenv
from google.adk.agents import Agent

from .template_tools import (
    list_template_files,
    scaffold_cicd_template,
    scaffold_iac_template,
)

dotenv.load_dotenv()

MODEL = os.getenv("INFRAPILOT_MODEL", "gemini-3.1-pro-preview")

Provider = Literal["aws", "azure", "gcp"]
Tool = Literal["terraform", "opentofu", "pulumi", "bicep"]
Pipeline = Literal["github", "azure-devops", "jenkins"]


STACKS = {
    ("terraform", "aws"): {
        "tool_version": ">= 1.9.0",
        "provider_pin": "hashicorp/aws = 5.70.0",
        "modules": [
            "vpc",
            "security_group",
            "s3_bucket",
            "kms_key",
            "iam_role",
            "ec2_instance",
            "app_runner",
            "rds_instance",
            "lambda_function",
            "ecr_repository",
            "secrets_manager_secret",
        ],
        "backend": "Encrypted S3 backend with a unique key per environment and state locking.",
        "auth": "Prefer GitHub OIDC role assumption; local SDK credentials use AWS environment variables.",
        "variables": "Keep names, CIDRs, tags, and sizes in each environment's locals.tf.",
    },
    ("terraform", "azure"): {
        "tool_version": ">= 1.9.0",
        "provider_pin": "hashicorp/azurerm = 4.70.0",
        "modules": [
            "resource_group",
            "virtual_network",
            "network_security_group",
            "app_service",
            "container_app",
            "key_vault",
            "storage_account",
            "user_assigned_identity",
            "linux_virtual_machine",
            "windows_virtual_machine",
            "postgresql_flexible_server",
            "function_app",
            "container_registry",
        ],
        "backend": "Encrypted Azure Blob backend with a unique state key per environment.",
        "auth": "Prefer workload identity federation; ARM credentials are supplied by the environment.",
        "variables": "Only ARM auth belongs in secret variables; naming and SKUs belong in locals.tf.",
    },
    ("terraform", "gcp"): {
        "tool_version": ">= 1.9.0",
        "provider_pin": "hashicorp/google = 6.10.0",
        "modules": [
            "vpc_network",
            "firewall",
            "gcs_bucket",
            "secret",
            "service_account",
            "compute_instance",
            "cloud_run",
            "cloud_sql",
            "cloud_function",
            "artifact_registry",
        ],
        "backend": "Versioned GCS backend with a unique state prefix per environment.",
        "auth": "Prefer Workload Identity Federation; never store a service-account key in IaC.",
        "variables": "Use project and region variables; keep names, labels, and sizes in locals.tf.",
    },
    ("pulumi", "aws"): {
        "tool_version": "Pulumi CLI >= 3.x",
        "provider_pin": "@pulumi/aws 6.x",
        "modules": [
            "vpc",
            "securityGroup",
            "s3Bucket",
            "kmsKey",
            "iamRole",
            "ec2Instance",
            "appRunner",
            "rdsInstance",
            "lambdaFunction",
            "ecrRepository",
            "secretsManagerSecret",
        ],
        "backend": "Pulumi service or configured backend, isolated by dev/test/prod stack.",
        "auth": "PULUMI_ACCESS_TOKEN plus keyless AWS identity where available.",
        "variables": "Put region and environment-specific values in Pulumi stack config.",
    },
    ("pulumi", "azure"): {
        "tool_version": "Pulumi CLI >= 3.x",
        "provider_pin": "@pulumi/azure-native 2.x",
        "modules": [
            "resourceGroup",
            "virtualNetwork",
            "networkSecurityGroup",
            "appService",
            "containerApp",
            "keyVault",
            "storageAccount",
            "userAssignedIdentity",
            "linuxVirtualMachine",
            "windowsVirtualMachine",
            "postgresqlFlexibleServer",
            "functionApp",
            "containerRegistry",
        ],
        "backend": "Pulumi service or configured backend, isolated by dev/test/prod stack.",
        "auth": "PULUMI_ACCESS_TOKEN plus Azure workload identity federation.",
        "variables": "Put location and environment-specific values in Pulumi stack config.",
    },
    ("pulumi", "gcp"): {
        "tool_version": "Pulumi CLI >= 3.x",
        "provider_pin": "@pulumi/gcp 8.x",
        "modules": [
            "vpcNetwork",
            "firewall",
            "gcsBucket",
            "secret",
            "serviceAccount",
            "computeInstance",
            "cloudRun",
            "cloudSql",
            "cloudFunction",
            "artifactRegistry",
        ],
        "backend": "Pulumi service or configured backend, isolated by dev/test/prod stack.",
        "auth": "PULUMI_ACCESS_TOKEN plus GCP Workload Identity Federation.",
        "variables": "Put project, region, and environment-specific values in Pulumi stack config.",
    },
    ("bicep", "azure"): {
        "tool_version": "Current Bicep CLI",
        "provider_pin": "Explicit REST apiVersion on every resource",
        "modules": [
            "resource_group",
            "virtual_network",
            "network_security_group",
            "app_service",
            "container_app",
            "key_vault",
            "storage_account",
            "user_assigned_identity",
            "linux_virtual_machine",
            "windows_virtual_machine",
            "postgresql_flexible_server",
            "function_app",
            "container_registry",
        ],
        "backend": "No external state backend; Azure Resource Manager is the source of truth.",
        "auth": "Use az login locally and Azure OIDC federation in CI.",
        "variables": "Use one .bicepparam file per environment; modules hardcode no environment values.",
    },
}

ENTERPRISE_DEFAULTS = {
    "tags": ["environment", "project", "owner", "cost-center", "managed-by"],
    "data": [
        "Encrypt all stateful resources at rest.",
        "Expose a customer-managed key input where supported.",
        "Enable deletion protection for production stateful resources.",
    ],
    "network": [
        "No public exposure by default.",
        "Never allow 0.0.0.0/0 directly to compute or databases.",
        "Require TLS 1.2 or newer where configurable.",
    ],
    "identity": [
        "Use least-privilege workload identity.",
        "Prefer OIDC/workload federation over static cloud keys.",
        "Keep secrets in the platform secret manager and out of state.",
    ],
    "governance": [
        "Enable audit and diagnostic logging.",
        "Run validation and Checkov or an equivalent policy scanner on pull requests.",
        "Require approval-gated test and production applies.",
        "Never run auto-approved apply from a push trigger.",
    ],
}


def _normalise_stack(tool: str, provider: str) -> tuple[str, str]:
    normalised_tool = tool.strip().lower().replace("open tofu", "opentofu")
    normalised_provider = provider.strip().lower().replace("google", "gcp")
    if normalised_tool == "opentofu":
        normalised_tool = "terraform"
    return normalised_tool, normalised_provider


def list_supported_stacks() -> dict:
    """List the IaC tool and cloud combinations known by this agent."""
    stacks = [
        {
            "tool": tool,
            "provider": provider,
            "tool_version": details["tool_version"],
            "provider_pin": details["provider_pin"],
        }
        for (tool, provider), details in STACKS.items()
    ]
    stacks.append(
        {
            "tool": "opentofu",
            "provider": "aws/azure/gcp",
            "tool_version": ">= 1.8",
            "provider_pin": "Reuses the matching Terraform provider pins",
        }
    )
    return {"status": "success", "stacks": stacks}


def get_stack_guidance(tool: Tool, provider: Provider) -> dict:
    """Return versions, modules, layout, state, and authentication guidance.

    Args:
        tool: Infrastructure-as-code tool.
        provider: Target cloud provider.
    """
    requested_tool = tool
    key = _normalise_stack(tool, provider)
    stack = STACKS.get(key)
    if not stack:
        return {
            "status": "error",
            "message": f"No bundled knowledge for {tool} on {provider}.",
            "fallback": "Generate idiomatic IaC, pin versions, and retain the same security rules.",
        }

    if key[0] == "terraform":
        layout = (
            "infrastructure/{tool}/modules/<module> plus independent "
            "environments/dev, environments/test, and environments/prod roots"
        ).format(tool=requested_tool)
    elif key[0] == "pulumi":
        layout = (
            "infrastructure/pulumi/components plus index.ts, Pulumi.yaml, "
            "and Pulumi.<env>.yaml stack configuration"
        )
    else:
        layout = (
            "infrastructure/bicep/modules plus main.bicep, one parameter file "
            "per environment, and bicepconfig.json"
        )

    return {
        "status": "success",
        "tool": requested_tool,
        "provider": provider,
        "layout": layout,
        **stack,
    }


def recommend_stack(
    requirements: str,
    preferred_tool: str | None = None,
    preferred_provider: str | None = None,
) -> dict:
    """Recommend a supported IaC stack from a free-text infrastructure request.

    Args:
        requirements: User's infrastructure request.
        preferred_tool: Optional explicit IaC tool preference.
        preferred_provider: Optional explicit cloud preference.
    """
    text = requirements.lower()
    provider = (preferred_provider or "").lower()
    tool = (preferred_tool or "").lower()

    if not provider:
        if "azure" in text:
            provider = "azure"
        elif "gcp" in text or "google cloud" in text:
            provider = "gcp"
        elif "aws" in text:
            provider = "aws"
    if not tool:
        if "bicep" in text:
            tool = "bicep"
        elif "pulumi" in text:
            tool = "pulumi"
        elif "opentofu" in text or "open tofu" in text:
            tool = "opentofu"
        elif "terraform" in text:
            tool = "terraform"

    missing = [
        field
        for field, value in (("tool", tool), ("provider", provider))
        if not value
    ]
    if missing:
        return {
            "status": "needs_clarification",
            "missing": missing,
            "message": "Ask the user for the missing choice; do not silently choose a cloud.",
        }

    guidance = get_stack_guidance(tool, provider)  # type: ignore[arg-type]
    return {
        **guidance,
        "recommendation_reason": (
            "Uses the user's explicit preference or a tool/provider named in the request."
        ),
    }


def get_cicd_guidance(
    platform: Pipeline,
    tool: Tool,
    provider: Provider,
) -> dict:
    """Return CI/CD stages, files, credentials, and approval requirements.

    Args:
        platform: GitHub Actions, Azure DevOps, or Jenkins.
        tool: Infrastructure-as-code tool.
        provider: Target cloud provider.
    """
    stack = get_stack_guidance(tool, provider)
    if stack["status"] == "error":
        return stack

    platform_files = {
        "github": (
            "An internal callable deploy workflow, a validate workflow, and "
            "thin dev/test/prod caller workflows."
        ),
        "azure-devops": (
            "A shared deployment stage template and thin dev/test/prod pipeline files."
        ),
        "jenkins": (
            "A declarative Jenkinsfile with an ENVIRONMENT choice parameter."
        ),
    }
    validation = {
        "terraform": ["format check", "init", "validate", "Checkov", "plan"],
        "opentofu": ["format check", "init", "validate", "Checkov", "plan"],
        "pulumi": ["npm ci", "TypeScript compile", "pulumi preview"],
        "bicep": ["az bicep build", "Checkov", "Azure what-if"],
    }
    return {
        "status": "success",
        "platform": platform,
        "files": platform_files[platform],
        "validation_stages": validation[tool],
        "deployment": "Apply only from a gated job; require approval for test and production.",
        "authentication": stack["auth"],
        "pull_requests": "Publish the plan, preview, or what-if result for review.",
    }


def get_enterprise_requirements() -> dict:
    """Return the mandatory production, security, and compliance defaults."""
    return {
        "status": "success",
        "defaults": ENTERPRISE_DEFAULTS,
        "required_placeholders": [
            "owner and cost-center",
            "backend storage identifiers",
            "KMS/CMK key identifiers",
            "central log destination",
            "OIDC application, role, or service-account identifiers",
        ],
        "bootstrap_order": [
            "Create and secure backend storage.",
            "Configure OIDC or workload identity federation.",
            "Configure test and production approval environments.",
            "Run and review the first plan or preview in each environment.",
        ],
    }


def get_migration_guidance(source: str, target: str) -> dict:
    """Return safe migration rules for tool or provider version changes.

    Args:
        source: Current tool/provider/version.
        target: Desired tool/provider/version.
    """
    source_lower = source.lower()
    target_lower = target.lower()
    if {"terraform", "opentofu"}.issubset({source_lower, target_lower}):
        strategy = [
            "Verify state-format compatibility for the selected versions.",
            "Run init with state migration in each environment root.",
            "Swap setup actions and CLI command names in CI.",
            "Review a no-change plan before any apply.",
        ]
    elif source_lower.split()[0] == target_lower.split()[0]:
        strategy = [
            "Read the official upgrade guide; never bump a provider major blind.",
            "Update the provider and CI pins together.",
            "Upgrade dependencies and compile or initialize.",
            "Review plans from dev to test to production; stop on unexplained replacement.",
        ]
    else:
        strategy = [
            "Treat this as a rewrite plus state adoption, not a file conversion.",
            "Import existing resources into the target tool module by module.",
            "Require an empty plan or preview after every batch.",
            "Retire the old state only after the target owns all resources.",
        ]
    return {
        "status": "success",
        "source": source,
        "target": target,
        "strategy": strategy,
    }


root_agent = Agent(
    name="infrapilot",
    model=MODEL,
    description=(
        "An infrastructure-as-code agent that designs maintainable, secure "
        "Terraform, OpenTofu, Pulumi, and Bicep stacks across AWS, Azure, and GCP."
    ),
    instruction="""
You are InfraPilot, a precise infrastructure-as-code agent. Turn infrastructure
requests into production-ready IaC designs and code while keeping them minimal,
secure, version-pinned, and maintainable.

Workflow:
1. Understand existing IaC before proposing changes. Match its tool, provider,
   layout, naming, and conventions; extend idempotently and never blindly overwrite.
2. Resolve the tool and provider from the request. Use recommend_stack when either
   is unclear and ask for missing choices instead of silently choosing a cloud.
3. Call get_stack_guidance before generating a supported stack. Use only modules
   needed by the request and wire dependencies through outputs, never hardcoded IDs.
   Use list_template_files to inspect bundled assets without loading every template.
   Use scaffold_iac_template to copy the closest bundled stack instead of regenerating
   known modules only when the user explicitly supplies a target directory. An absolute
   or relative user path is accepted. Existing files are protected unless overwrite is
   explicitly approved. If the user does not provide a target directory, do not call a
   scaffold tool and do not choose a default path: present the proposed file tree and
   relevant code or configuration in chat instead.
4. Keep reusable modules/components separate from environment-specific roots or
   stack configuration. Dev, test, and prod are independently composed; omit a
   resource from an environment rather than scattering conditional count flags.
5. Call get_cicd_guidance when CI/CD is requested. Plans/previews belong on pull
   requests, and test/production applies require approval. Use scaffold_cicd_template
   to copy a supported pipeline and then identify its required placeholders.
6. Call get_enterprise_requirements for every production, enterprise, secure,
   compliant, or regulated request and apply all defaults unless explicitly declined.
7. Call get_migration_guidance for upgrades or migrations.
8. Report the intended file tree, generated files, validation commands, and every
   placeholder the user must fill before plan/apply.

Core rules:
- Reuse modules/components and keep the result minimal.
- Pin tool and provider versions. Do not invent unsupported version claims.
- Configure remote, encrypted, isolated state for Terraform/OpenTofu.
- Never hardcode secrets, credentials, account IDs, subscription IDs, or project IDs.
- Prefer OIDC/workload federation and least-privilege identities.
- Never expose databases, state, secrets, or compute publicly by default.
- Never claim code was validated or deployed unless the user supplied that evidence.
- Never run or recommend an unattended production apply.
- For unsupported tools such as CloudFormation, CDK, or Ansible, generate idiomatic
  code while retaining the same environment, secrets, state, security, and CI rules.

When producing code in chat, organize it by file path and explain placeholders
briefly. Do not include speculative resources that the user did not request.
""",
    tools=[
        list_supported_stacks,
        recommend_stack,
        get_stack_guidance,
        get_cicd_guidance,
        get_enterprise_requirements,
        get_migration_guidance,
        list_template_files,
        scaffold_iac_template,
        scaffold_cicd_template,
    ],
)
