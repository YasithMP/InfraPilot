"""Shared per-user config location for all three agents.

Installed CLIs read credentials from the user's home directory, not a
repo-relative .env — that only exists in a git checkout, not a pip install.
"""
from __future__ import annotations

from pathlib import Path

CONFIG_DIR = Path.home() / ".infrapilot"
CONFIG_ENV_FILE = CONFIG_DIR / ".env"
