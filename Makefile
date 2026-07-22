ifeq ($(OS),Windows_NT)
VENV_BIN := .venv/Scripts
else
VENV_BIN := .venv/bin
endif

PYTHON  := $(VENV_BIN)/python
ADK     := $(VENV_BIN)/adk
DIAGRAM_AGENT_URL  ?= http://localhost:8001
DIAGRAM_AGENT_HOST ?= localhost
DIAGRAM_AGENT_PORT ?= 8001

.PHONY: venv install run diagrammer pilot test clean

venv:
	python -m venv .venv

install: venv
	$(PYTHON) -m pip install -r requirements.txt


run:
	@$(PYTHON) -m InfraDiagrammer & \
	DIAG_PID=$$!; \
	trap 'kill $$DIAG_PID 2>/dev/null' EXIT INT TERM; \
	echo "waiting for InfraDiagrammer on $(DIAGRAM_AGENT_URL) ..."; \
	for i in $$(seq 1 50); do \
		curl -s -o /dev/null "$(DIAGRAM_AGENT_URL)/.well-known/agent-card.json" && break; \
		sleep 0.2; \
	done; \
	DIAGRAM_AGENT_URL=$(DIAGRAM_AGENT_URL) $(ADK) web; \
	kill $$DIAG_PID 2>/dev/null

diagrammer:
	DIAGRAM_AGENT_HOST=$(DIAGRAM_AGENT_HOST) DIAGRAM_AGENT_PORT=$(DIAGRAM_AGENT_PORT) $(PYTHON) -m InfraDiagrammer

pilot:
	DIAGRAM_AGENT_URL=$(DIAGRAM_AGENT_URL) $(ADK) web

test:
	$(PYTHON) -m pytest tests/ -v

clean:
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
	rm -rf .pytest_cache
