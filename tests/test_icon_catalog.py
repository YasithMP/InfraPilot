import json
from pathlib import Path

import pytest

ICON_ROOT = Path(__file__).resolve().parent.parent / "InfraDiagrammer" / "assets" / "icons"
PROVIDERS = ["aws", "azure", "gcp", "generic"]
TEMPLATED_PROVIDERS = ["aws", "azure"]


def load(provider: str) -> dict:
    return json.loads((ICON_ROOT / f"{provider}.json").read_text(encoding="utf-8"))


def entries(catalog: dict) -> list[dict]:
    return catalog["icons"] + catalog["groups"]


def materialized_style(catalog: dict, entry: dict) -> str:
    """The style the agent's tools produce for an entry at load time."""
    if "style" in entry:
        return entry["style"]
    return catalog["icon_template"].format(ref=entry["ref"])


@pytest.mark.parametrize("provider", PROVIDERS)
def test_catalog_loads_with_unique_aliases_and_valid_sizes(provider):
    catalog = load(provider)
    assert catalog["provider"] == provider
    items = entries(catalog)
    assert items, f"{provider} catalog is empty"
    aliases = [entry["alias"] for entry in items]
    assert len(aliases) == len(set(aliases)), f"duplicate aliases in {provider}"
    for entry in items:
        assert entry["alias"] == f"{entry['kind']}:{provider}:{entry['key']}"
        assert entry["width"] > 0 and entry["height"] > 0
        assert entry["width"] % 10 == 0 and entry["height"] % 10 == 0


@pytest.mark.parametrize("provider", TEMPLATED_PROVIDERS)
def test_templated_catalogs_construct_styles_from_refs(provider):
    """Knowledge form: a documented template plus factual identifiers, no
    copied per-entry styles."""
    catalog = load(provider)
    template = catalog["icon_template"]
    assert "{ref}" in template
    for entry in catalog["icons"]:
        assert entry["ref"].strip(), f"empty ref for {entry['key']}"
        assert "style" not in entry or entry["style"].strip()
    for entry in catalog["groups"]:
        assert entry["style"].strip(), f"empty group style for {entry['key']}"


STACK_KEYS = {
    "aws": {
        "vpc", "s3_bucket", "kms_key", "iam_role", "ec2_instance", "app_runner",
        "rds_instance", "lambda_function", "ecr_repository",
        "secrets_manager_secret", "internet_gateway", "nat_gateway",
        "application_load_balancer", "route_53", "cloudfront", "cloudwatch",
        "user", "users", "internet", "client",
    },
    "azure": {
        "resource_group", "virtual_network", "network_security_group",
        "app_service", "container_app", "key_vault", "storage_account",
        "user_assigned_identity", "linux_virtual_machine",
        "windows_virtual_machine", "postgresql_flexible_server", "function_app",
        "container_registry", "application_gateway", "load_balancer", "dns",
        "cdn", "monitor",
    },
    "gcp": {
        "vpc_network", "firewall", "gcs_bucket", "secret", "service_account",
        "compute_instance", "cloud_run", "cloud_sql", "cloud_function",
        "artifact_registry", "load_balancing", "cloud_dns", "cloud_cdn",
        "cloud_nat", "kms",
    },
}


@pytest.mark.parametrize("provider,required", sorted(STACK_KEYS.items()))
def test_stack_modules_have_icons(provider, required):
    have = {entry["key"] for entry in load(provider)["icons"]}
    assert required <= have, f"missing icon keys: {sorted(required - have)}"


@pytest.mark.parametrize("provider,required", [
    ("aws", {"aws_cloud", "region", "vpc", "availability_zone",
             "public_subnet", "private_subnet", "account", "security_group"}),
    ("azure", {"resource_group", "virtual_network", "subnet"}),
    ("gcp", {"project", "vpc_network"}),
])
def test_group_containers_present(provider, required):
    have = {entry["key"] for entry in load(provider)["groups"]}
    assert required <= have, f"missing group keys: {sorted(required - have)}"


def test_materialized_styles_are_official():
    aws = load("aws")
    for entry in entries(aws):
        assert "mxgraph.aws4" in materialized_style(aws, entry), entry["key"]

    azure = load("azure")
    for entry in azure["icons"]:
        assert materialized_style(azure, entry).endswith(f"image=img/lib/azure2/{entry['ref']};"), entry["key"]
        assert entry["ref"].endswith(".svg"), entry["key"]

    gcp = load("gcp")
    for entry in gcp["icons"]:
        style = materialized_style(gcp, entry)
        assert ("image=data:image/svg+xml" in style) or ("mxgraph.gcp2" in style), entry["key"]
