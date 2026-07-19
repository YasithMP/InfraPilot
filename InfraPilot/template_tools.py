from __future__ import annotations

import shutil
from pathlib import Path
from typing import Literal


ASSET_ROOT = Path(__file__).resolve().parent / "assets" / "templates"

IAC_SOURCES = {
    ("terraform", "aws"): Path("iac/terraform/aws@5.70.0"),
    ("terraform", "azure"): Path("iac/terraform/azure@4.70.0"),
    ("terraform", "gcp"): Path("iac/terraform/google@6.10.0"),
    ("opentofu", "aws"): Path("iac/terraform/aws@5.70.0"),
    ("opentofu", "azure"): Path("iac/terraform/azure@4.70.0"),
    ("opentofu", "gcp"): Path("iac/terraform/google@6.10.0"),
    ("pulumi", "aws"): Path("iac/pulumi/aws@6.0.0"),
    ("pulumi", "azure"): Path("iac/pulumi/azure-native@2.0.0"),
    ("pulumi", "gcp"): Path("iac/pulumi/gcp@8.0.0"),
    ("bicep", "azure"): Path("iac/bicep/azure"),
}

CI_SOURCES = {
    ("github", "terraform", "aws"): Path("cicd/github/terraform/aws"),
    ("github", "terraform", "azure"): Path("cicd/github/terraform/azure"),
    ("github", "terraform", "gcp"): Path("cicd/github/terraform/gcp"),
    ("github", "opentofu", "aws"): Path("cicd/github/terraform/aws"),
    ("github", "opentofu", "azure"): Path("cicd/github/terraform/azure"),
    ("github", "opentofu", "gcp"): Path("cicd/github/terraform/gcp"),
    ("github", "pulumi", "aws"): Path("cicd/github/pulumi"),
    ("github", "pulumi", "azure"): Path("cicd/github/pulumi"),
    ("github", "pulumi", "gcp"): Path("cicd/github/pulumi"),
    ("github", "bicep", "azure"): Path("cicd/github/bicep/azure"),
    ("azure-devops", "terraform", "aws"): Path("cicd/devops/terraform/aws"),
    ("azure-devops", "terraform", "azure"): Path("cicd/devops/terraform/azure"),
    ("azure-devops", "terraform", "gcp"): Path("cicd/devops/terraform/gcp"),
    ("azure-devops", "opentofu", "aws"): Path("cicd/devops/terraform/aws"),
    ("azure-devops", "opentofu", "azure"): Path("cicd/devops/terraform/azure"),
    ("azure-devops", "opentofu", "gcp"): Path("cicd/devops/terraform/gcp"),
    ("azure-devops", "pulumi", "aws"): Path("cicd/devops/pulumi"),
    ("azure-devops", "pulumi", "azure"): Path("cicd/devops/pulumi"),
    ("azure-devops", "pulumi", "gcp"): Path("cicd/devops/pulumi"),
    ("azure-devops", "bicep", "azure"): Path("cicd/devops/bicep/azure"),
    ("jenkins", "terraform", "aws"): Path("cicd/jenkins/terraform/aws"),
    ("jenkins", "terraform", "azure"): Path("cicd/jenkins/terraform/azure"),
    ("jenkins", "terraform", "gcp"): Path("cicd/jenkins/terraform/gcp"),
    ("jenkins", "opentofu", "aws"): Path("cicd/jenkins/terraform/aws"),
    ("jenkins", "opentofu", "azure"): Path("cicd/jenkins/terraform/azure"),
    ("jenkins", "opentofu", "gcp"): Path("cicd/jenkins/terraform/gcp"),
    ("jenkins", "pulumi", "aws"): Path("cicd/jenkins/pulumi"),
    ("jenkins", "pulumi", "azure"): Path("cicd/jenkins/pulumi"),
    ("jenkins", "pulumi", "gcp"): Path("cicd/jenkins/pulumi"),
    ("jenkins", "bicep", "azure"): Path("cicd/jenkins/bicep/azure"),
}

PULUMI_ROOT_COMPONENTS = {
    "aws": {"vpc", "securityGroup", "s3Bucket"},
    "azure": {"resourceGroup", "virtualNetwork", "storageAccount"},
    "gcp": {"vpcNetwork", "firewall", "gcsBucket"},
}
BICEP_ROOT_MODULES = {"resource_group", "virtual_network", "storage_account"}


def _normalise(value: str) -> str:
    return value.strip().lower().replace("google", "gcp").replace("open tofu", "opentofu")


def _safe_target(target_directory: str) -> Path:
    if not target_directory.strip():
        raise ValueError(
            "No target directory was supplied. Return the proposed files in chat."
        )
    return Path(target_directory).expanduser().resolve()


def _copy_file(source: Path, destination: Path, overwrite: bool) -> tuple[str, str]:
    relative = str(destination)
    existed = destination.exists()
    if existed and not overwrite:
        return "skipped", relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    return "updated" if existed else "created", relative


def _copy_tree(
    source: Path,
    destination: Path,
    overwrite: bool,
) -> tuple[list[str], list[str]]:
    copied: list[str] = []
    skipped: list[str] = []
    for source_file in source.rglob("*"):
        if not source_file.is_file() or source_file.is_symlink():
            continue
        destination_file = destination / source_file.relative_to(source)
        existed = destination_file.exists()
        if existed and not overwrite:
            skipped.append(str(destination_file))
            continue
        destination_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_file, destination_file)
        copied.append(str(destination_file))
    return copied, skipped


def list_template_files(
    category: Literal["iac", "cicd"] = "iac",
    tool: str | None = None,
    provider: str | None = None,
    platform: str | None = None,
) -> dict:
    """List bundled templates without loading their contents into the model.

    Args:
        category: Infrastructure or CI/CD templates.
        tool: Optional IaC tool filter.
        provider: Optional cloud provider filter.
        platform: Optional CI/CD platform filter.
    """
    normalised_tool = _normalise(tool) if tool else None
    normalised_provider = _normalise(provider) if provider else None
    normalised_platform = _normalise(platform) if platform else None
    entries = []

    source_map = IAC_SOURCES if category == "iac" else CI_SOURCES
    for key, relative_source in source_map.items():
        key_tool = key[-2] if category == "cicd" else key[0]
        key_provider = key[-1]
        key_platform = key[0] if category == "cicd" else None
        if normalised_tool and key_tool != normalised_tool:
            continue
        if normalised_provider and key_provider != normalised_provider:
            continue
        if normalised_platform and key_platform != normalised_platform:
            continue
        source = ASSET_ROOT / relative_source
        entries.append(
            {
                "platform": key_platform,
                "tool": key_tool,
                "provider": key_provider,
                "source": str(relative_source).replace("\\", "/"),
                "files": [
                    str(path.relative_to(source)).replace("\\", "/")
                    for path in source.rglob("*")
                    if path.is_file()
                ],
            }
        )
    return {"status": "success", "count": len(entries), "templates": entries}


def scaffold_iac_template(
    tool: Literal["terraform", "opentofu", "pulumi", "bicep"],
    provider: Literal["aws", "azure", "gcp"],
    target_directory: str,
    modules: list[str] | None = None,
    environments: list[str] | None = None,
    overwrite: bool = False,
) -> dict:
    """Copy a bundled IaC stack into a guarded output directory.

    Args:
        tool: IaC tool.
        provider: Target cloud.
        target_directory: Explicit project path supplied by the user.
        modules: Optional module/component names; omit to copy all.
        environments: Terraform/OpenTofu environment roots; defaults to dev/test/prod.
        overwrite: Whether existing files may be replaced.
    """
    normalised_tool = _normalise(tool)
    normalised_provider = _normalise(provider)
    source_relative = IAC_SOURCES.get((normalised_tool, normalised_provider))
    if source_relative is None:
        return {
            "status": "error",
            "message": f"No IaC template for {tool} on {provider}.",
        }

    source = ASSET_ROOT / source_relative
    if not source.is_dir():
        return {"status": "error", "message": f"Bundled source is missing: {source}"}

    try:
        project_root = _safe_target(target_directory)
    except ValueError as error:
        return {"status": "error", "message": str(error)}

    destination = project_root / "infrastructure" / normalised_tool
    requested = set(modules or [])
    copied: list[str] = []
    skipped: list[str] = []
    unknown: list[str] = []

    if normalised_tool in {"terraform", "opentofu"}:
        available = {path.name for path in source.iterdir() if path.is_dir()}
        selected = requested or available
        unknown = sorted(selected - available)
        for module in sorted(selected & available):
            new_files, old_files = _copy_tree(
                source / module,
                destination / "modules" / module,
                overwrite,
            )
            copied.extend(new_files)
            skipped.extend(old_files)

        root_files = ["provider.tf", "versions.tf", "backend.tf"]
        selected_environments = environments or ["dev", "test", "prod"]
        for environment in selected_environments:
            safe_environment = environment.strip().lower()
            if not safe_environment.replace("-", "").isalnum():
                return {
                    "status": "error",
                    "message": f"Invalid environment name: {environment}",
                }
            environment_root = destination / "environments" / safe_environment
            for filename in root_files:
                status, path = _copy_file(
                    source / filename,
                    environment_root / filename,
                    overwrite,
                )
                (skipped if status == "skipped" else copied).append(path)

    elif normalised_tool == "pulumi":
        components_root = source / "components"
        available = {path.stem for path in components_root.glob("*.ts")}
        selected = requested or available
        selected |= PULUMI_ROOT_COMPONENTS[normalised_provider]
        unknown = sorted(selected - available)
        for component in sorted(selected & available):
            status, path = _copy_file(
                components_root / f"{component}.ts",
                destination / "components" / f"{component}.ts",
                overwrite,
            )
            (skipped if status == "skipped" else copied).append(path)
        for source_file in source.iterdir():
            if not source_file.is_file():
                continue
            status, path = _copy_file(
                source_file,
                destination / source_file.name,
                overwrite,
            )
            (skipped if status == "skipped" else copied).append(path)

    else:
        modules_root = source / "modules"
        available = {path.stem for path in modules_root.glob("*.bicep")}
        selected = requested or available
        selected |= BICEP_ROOT_MODULES
        unknown = sorted(selected - available)
        for module in sorted(selected & available):
            status, path = _copy_file(
                modules_root / f"{module}.bicep",
                destination / "modules" / f"{module}.bicep",
                overwrite,
            )
            (skipped if status == "skipped" else copied).append(path)
        for source_file in source.iterdir():
            if not source_file.is_file():
                continue
            status, path = _copy_file(
                source_file,
                destination / source_file.name,
                overwrite,
            )
            (skipped if status == "skipped" else copied).append(path)

    return {
        "status": "success",
        "project_root": str(project_root),
        "template_source": str(source_relative).replace("\\", "/"),
        "copied_files": copied,
        "skipped_existing_files": skipped,
        "unknown_modules": unknown,
        "next_steps": [
            "Wire only the requested modules in each environment root.",
            "Replace TODO placeholders for backend, names, regions, and identity.",
            "Run format, validation, security scanning, and plan/preview before apply.",
        ],
    }


def scaffold_cicd_template(
    platform: Literal["github", "azure-devops", "jenkins"],
    tool: Literal["terraform", "opentofu", "pulumi", "bicep"],
    provider: Literal["aws", "azure", "gcp"],
    target_directory: str,
    overwrite: bool = False,
) -> dict:
    """Copy bundled CI/CD files into a guarded project directory.

    Args:
        platform: CI/CD platform.
        tool: IaC tool.
        provider: Target cloud.
        target_directory: Explicit project path supplied by the user.
        overwrite: Whether existing files may be replaced.
    """
    key = (_normalise(platform), _normalise(tool), _normalise(provider))
    source_relative = CI_SOURCES.get(key)
    if source_relative is None:
        return {
            "status": "error",
            "message": f"No CI/CD template for {platform}, {tool}, and {provider}.",
        }

    source = ASSET_ROOT / source_relative
    try:
        project_root = _safe_target(target_directory)
    except ValueError as error:
        return {"status": "error", "message": str(error)}

    destinations = {
        "github": project_root / ".github" / "workflows",
        "azure-devops": project_root / "pipelines" / "azure-devops",
        "jenkins": project_root,
    }
    copied, skipped = _copy_tree(source, destinations[key[0]], overwrite)
    return {
        "status": "success",
        "project_root": str(project_root),
        "template_source": str(source_relative).replace("\\", "/"),
        "copied_files": copied,
        "skipped_existing_files": skipped,
        "next_steps": [
            "Configure OIDC or the documented service connection.",
            "Replace backend, account, subscription, project, and region placeholders.",
            "Configure required reviewers for test and production environments.",
        ],
    }
