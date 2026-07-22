import pytest

pytest.importorskip("google.adk")

from ComplianceMapper.agent import root_agent as compliance_agent
from InfraDiagrammer.agent import root_agent as diagrammer_agent
from InfraPilot.agent import root_agent as pilot_agent


def _tool_names(agent):
    return {
        getattr(tool, "__name__", None) or getattr(tool, "name", "")
        for tool in agent.tools
    }


def test_infra_diagrammer_exposes_the_four_diagram_tools():
    names = _tool_names(diagrammer_agent)
    assert {
        "get_diagram_guidance",
        "search_cloud_icons",
        "validate_drawio_xml",
        "save_drawio_diagram",
    } <= names


def test_infrapilot_delegates_via_request_architecture_diagram():
    names = _tool_names(pilot_agent)
    assert "infra_diagrammer" in names
    assert not {
        "get_diagram_guidance",
        "search_cloud_icons",
        "validate_drawio_xml",
        "save_drawio_diagram",
    } & names


def test_infrapilot_instruction_covers_delegation():
    instruction = pilot_agent.instruction
    assert "request_architecture_diagram" in instruction
    assert "python -m InfraDiagrammer" in instruction


COMPLIANCE_TOOLS = {
    "list_frameworks",
    "get_framework_requirements",
    "get_mapping_guidance",
    "save_gap_report",
}


def test_compliance_mapper_exposes_the_four_compliance_tools():
    assert COMPLIANCE_TOOLS <= _tool_names(compliance_agent)


def test_infrapilot_delegates_via_request_compliance_mapping():
    names = _tool_names(pilot_agent)
    assert "compliance_mapper" in names
    assert not COMPLIANCE_TOOLS & names


def test_infrapilot_instruction_covers_compliance_delegation():
    instruction = pilot_agent.instruction
    assert "request_compliance_mapping" in instruction
    assert "python -m ComplianceMapper" in instruction
