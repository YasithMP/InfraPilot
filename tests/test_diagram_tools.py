from InfraDiagrammer.diagram_tools import (
    build_diagram_url,
    get_diagram_guidance,
    save_drawio_diagram,
    search_cloud_icons,
    validate_drawio_xml,
)

VALID_XML = """<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio">
  <diagram name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="AWS Lambda" style="icon:aws:lambda_function" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="60" height="60" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Amazon S3" style="icon:aws:s3_bucket" vertex="1" parent="1">
          <mxGeometry x="240" y="40" width="60" height="60" as="geometry" />
        </mxCell>
        <mxCell id="4" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


def test_search_returns_alias_and_size_without_raw_style():
    result = search_cloud_icons("aws", "lambda")
    assert result["status"] == "success"
    match = next(m for m in result["matches"] if m["alias"] == "icon:aws:lambda_function")
    assert match["name"] == "AWS Lambda"
    assert match["width"] > 0 and match["height"] > 0
    assert "style" not in match


def test_search_empty_query_lists_everything_including_groups():
    result = search_cloud_icons("gcp", "")
    aliases = {m["alias"] for m in result["matches"]}
    assert "icon:gcp:cloud_run" in aliases
    assert "group:gcp:vpc_network" in aliases


def test_search_matches_name_and_category_terms():
    result = search_cloud_icons("azure", "security key")
    aliases = {m["alias"] for m in result["matches"]}
    assert "icon:azure:key_vault" in aliases


def test_search_unknown_provider_lists_valid_providers():
    result = search_cloud_icons("oracle", "db")
    assert result["status"] == "error"
    assert set(result["valid_providers"]) == {"aws", "azure", "gcp", "generic"}


def test_search_expands_common_abbreviations():
    result = search_cloud_icons("aws", "alb")
    assert "icon:aws:application_load_balancer" in {m["alias"] for m in result["matches"]}
    result = search_cloud_icons("azure", "nsg")
    assert "icon:azure:network_security_group" in {m["alias"] for m in result["matches"]}
    result = search_cloud_icons("azure", "vm")
    assert "icon:azure:linux_virtual_machine" in {m["alias"] for m in result["matches"]}


def test_guidance_contains_rules_and_provider_notes():
    result = get_diagram_guidance("aws")
    assert result["status"] == "success"
    assert "icon:<provider>:<key>" in result["rules"]
    assert "mxGeometry relative" in result["rules"]
    assert "group:aws:aws_cloud" in result["provider_notes"]


def test_guidance_without_provider_and_unknown_provider():
    assert get_diagram_guidance()["status"] == "success"
    assert get_diagram_guidance("oracle")["status"] == "error"


def test_validate_accepts_a_minimal_valid_diagram():
    result = validate_drawio_xml(VALID_XML)
    assert result["status"] == "success", result["errors"]
    assert result["errors"] == []


def test_validate_rejects_unknown_alias():
    result = validate_drawio_xml(VALID_XML.replace("icon:aws:lambda_function", "icon:aws:nope"))
    assert result["status"] == "error"
    assert any("icon:aws:nope" in error for error in result["errors"])


def test_validate_rejects_unparseable_xml():
    result = validate_drawio_xml("<mxfile><broken")
    assert result["status"] == "error"
    assert any("parse" in error.lower() for error in result["errors"])


def test_validate_requires_root_cells():
    result = validate_drawio_xml(VALID_XML.replace('<mxCell id="1" parent="0" />', ""))
    assert result["status"] == "error"
    assert any("root" in error.lower() for error in result["errors"])


def test_validate_rejects_duplicate_ids():
    result = validate_drawio_xml(VALID_XML.replace('id="3" value="Amazon S3"', 'id="2" value="Amazon S3"'))
    assert result["status"] == "error"
    assert any("duplicate" in error.lower() for error in result["errors"])


def test_validate_rejects_self_closing_edge():
    result = validate_drawio_xml(
        VALID_XML.replace(
            """<mxGeometry relative="1" as="geometry" />
        </mxCell>""",
            "",
        ).replace(
            'edge="1" parent="1" source="2" target="3">',
            'edge="1" parent="1" source="2" target="3" />',
        )
    )
    assert result["status"] == "error"
    assert any("geometry" in error.lower() for error in result["errors"])


def test_validate_rejects_dangling_edge():
    result = validate_drawio_xml(VALID_XML.replace('target="3"', 'target="99"'))
    assert result["status"] == "error"
    assert any("dangling" in error.lower() for error in result["errors"])


def test_validate_warns_on_unsnapped_coordinates_and_overlap():
    xml = VALID_XML.replace('x="240" y="40"', 'x="45" y="42"')
    result = validate_drawio_xml(xml)
    assert result["status"] == "success"
    assert any("snapped" in warning for warning in result["warnings"])
    assert any("overlap" in warning for warning in result["warnings"])


def test_validate_warns_on_hand_written_mxgraph_style():
    xml = VALID_XML.replace(
        'style="icon:aws:lambda_function"',
        'style="shape=mxgraph.aws3.lambda;"',
    )
    result = validate_drawio_xml(xml)
    assert result["status"] == "success"
    assert any("unverified" in warning for warning in result["warnings"])


def test_save_requires_a_target_directory():
    result = save_drawio_diagram(VALID_XML, "")
    assert result["status"] == "error"
    assert "build_diagram_url" in result["message"]


def test_build_diagram_url_encodes_the_expanded_diagram():
    result = build_diagram_url(VALID_XML)
    assert result["status"] == "success"
    assert result["url"].startswith("https://app.diagrams.net/#R")
    assert "icon:aws:lambda_function" not in result["url"]
    assert "resIcon%3Dmxgraph.aws4.lambda" in result["url"] or "resIcon=mxgraph.aws4.lambda" in result["url"]


def test_build_diagram_url_refuses_invalid_diagram():
    result = build_diagram_url(VALID_XML.replace('target="3"', 'target="99"'))
    assert result["status"] == "error"
    assert "errors" in result


def test_save_writes_expanded_xml(tmp_path):
    result = save_drawio_diagram(VALID_XML, str(tmp_path), filename="demo")
    assert result["status"] == "success"
    written = (tmp_path / "demo.drawio").read_text(encoding="utf-8")
    assert "resIcon=mxgraph.aws4.lambda" in written
    assert "icon:aws:lambda_function" not in written


def test_save_skips_existing_file_without_overwrite(tmp_path):
    (tmp_path / "demo.drawio").write_text("old", encoding="utf-8")
    result = save_drawio_diagram(VALID_XML, str(tmp_path), filename="demo")
    assert result["status"] == "skipped"
    assert (tmp_path / "demo.drawio").read_text(encoding="utf-8") == "old"
    result = save_drawio_diagram(VALID_XML, str(tmp_path), filename="demo", overwrite=True)
    assert result["status"] == "success"


def test_save_refuses_invalid_diagram(tmp_path):
    result = save_drawio_diagram(VALID_XML.replace('target="3"', 'target="99"'), str(tmp_path))
    assert result["status"] == "error"
    assert not (tmp_path / "architecture.drawio").exists()
