ifeq ($(OS),Windows_NT)
VENV_BIN := .venv/Scripts
else
VENV_BIN := .venv/bin
endif

PYTHON := $(VENV_BIN)/python
ADK    := $(VENV_BIN)/adk

.PHONY: venv install cli web test clean

venv:
	python -m venv .venv

install: venv
	$(PYTHON) -m pip install -e .
	
cli:
	$(ADK) run InfraPilot

web:
	$(ADK) web

test:
	$(PYTHON) -m pytest tests/ -v

clean:
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
	rm -rf .pytest_cache
