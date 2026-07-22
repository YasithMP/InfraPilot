import pytest

from ComplianceMapper.compliance_tools import (
    get_framework_requirements,
    get_mapping_guidance,
    list_frameworks,
    save_gap_report,
)

FRAMEWORKS = {"soc2", "hipaa", "pci_dss", "fedramp"}


def test_list_frameworks_returns_all_four():
    result = list_frameworks()
    assert result["status"] == "success"
    assert {f["framework"] for f in result["frameworks"]} == FRAMEWORKS
    assert all(f["requirement_count"] > 0 for f in result["frameworks"])


@pytest.mark.parametrize("framework", sorted(FRAMEWORKS))
def test_every_catalog_entry_is_well_formed(framework):
    result = get_framework_requirements(framework)
    assert result["status"] == "success"
    assert result["count"] == len(result["requirements"]) > 0
    assert result["notes"]
    for entry in result["requirements"]:
        assert entry["id"] and entry["name"] and entry["description"]
        assert entry["infra_signals"]


@pytest.mark.parametrize(
    ("alias", "expected"),
    [
        ("SOC 2", "soc2"),
        ("PCI-DSS", "pci_dss"),
        ("pci", "pci_dss"),
        ("FedRAMP Moderate", "fedramp"),
        ("NIST 800-53", "fedramp"),
        ("HIPAA", "hipaa"),
    ],
)
def test_framework_aliases_resolve(alias, expected):
    result = get_framework_requirements(alias)
    assert result["status"] == "success"
    assert result["framework"] == expected


def test_unknown_framework_lists_valid_ones():
    result = get_framework_requirements("iso27001")
    assert result["status"] == "error"
    assert set(result["valid_frameworks"]) == FRAMEWORKS


def test_query_filters_requirements():
    everything = get_framework_requirements("pci_dss")
    filtered = get_framework_requirements("pci_dss", query="encryption")
    assert 0 < filtered["count"] < everything["count"]


def test_mapping_guidance_covers_statuses():
    rules = get_mapping_guidance()["rules"]
    for status in ("satisfied", "partial", "gap", "inherited", "organizational", "unknown"):
        assert status in rules


def test_save_gap_report_writes_and_respects_overwrite(tmp_path):
    result = save_gap_report("# report", str(tmp_path), filename="soc2 gaps!")
    assert result["status"] == "success"
    path = tmp_path / "soc2_gaps.md"
    assert path.read_text(encoding="utf-8") == "# report"

    again = save_gap_report("# new", str(tmp_path), filename="soc2 gaps!")
    assert again["status"] == "skipped"
    assert path.read_text(encoding="utf-8") == "# report"

    forced = save_gap_report("# new", str(tmp_path), filename="soc2 gaps!", overwrite=True)
    assert forced["status"] == "success"
    assert path.read_text(encoding="utf-8") == "# new"


def test_save_gap_report_requires_target_directory():
    assert save_gap_report("# report", "   ")["status"] == "error"
