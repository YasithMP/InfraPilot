"""The `infrapilot` command: a terminal chat modeled on Claude Code / Codex /
Copilot CLI conventions — live spinner while the model thinks, `*` tool-call
markers with indented results, real markdown rendering (not a regex hack).

Runs the agent in-process via ADK's Runner directly (no `adk run` subprocess,
no its startup banner/warnings) so the terminal experience is ours to shape.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import sys
import warnings

from rich.console import Console
from rich.live import Live
from rich.markdown import Markdown
from rich.text import Text

warnings.filterwarnings("ignore", category=UserWarning, module="google.adk")
logging.getLogger("google_adk").setLevel(logging.ERROR)

# Windows' default console codepage (cp1252) can't encode ⎿/✻/etc — rich reads
# sys.stdout's encoding at Console() construction time, so fix it first.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

console = Console()


def _preview(value, limit: int = 64) -> str:
    text = json.dumps(value, default=str) if not isinstance(value, str) else value
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    # Cut at the last word boundary so tool-result previews don't end
    # mid-word (e.g. "provide…" instead of "provider…").
    truncated = text[: limit - 1]
    if " " in truncated:
        truncated = truncated.rsplit(" ", 1)[0]
    return truncated + "…"


# drawio/diagrams.net links embed the whole XML diagram URL-encoded in the
# fragment — can run to tens of thousands of chars. Collapse any long bare
# URL into a short clickable label instead of dumping it raw into the
# terminal. `(?<!\()` skips URLs already inside `[label](url)` markdown.
_LONG_URL_RE = re.compile(r"(?<!\()(https?://\S{100,})")


def _shorten_links(text: str) -> str:
    return _LONG_URL_RE.sub(r"[Open link ↗](\1)", text)


def _format_call(name: str, args: str) -> str:
    return f"* {name}({args})"


def _format_result(response) -> str:
    return f"  ⎿ {_preview(response)}"


async def _stream_turn(runner, user_id: str, session_id: str, query: str):
    """Run one turn and yield render-agnostic events, shared by cli.py's
    plain-terminal renderer and tui.py's Textual renderer.

    Yields:
        ("usage", event.usage_metadata)
        ("call", tool_name, preview_args)
        ("result", response_dict)
        ("text", buffer_so_far, is_final)
    """
    from google.adk.agents.run_config import RunConfig, StreamingMode
    from google.genai import types

    message = types.Content(role="user", parts=[types.Part(text=query)])
    run_config = RunConfig(streaming_mode=StreamingMode.SSE)
    buffer = ""
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=message, run_config=run_config
    ):
        if event.usage_metadata:
            yield ("usage", event.usage_metadata)
        if not event.content or not event.content.parts:
            continue
        for part in event.content.parts:
            # Function calls/responses are re-sent whole on the closing
            # non-partial event — only yield that one, unlike text below
            # which streams incrementally and needs every partial event.
            if getattr(part, "function_call", None):
                if event.partial:
                    continue
                fc = part.function_call
                yield ("call", fc.name, _preview(fc.args) if fc.args else "")
            elif getattr(part, "function_response", None):
                if event.partial:
                    continue
                yield ("result", part.function_response.response)
            elif getattr(part, "text", None):
                # Partial events carry incremental deltas; the closing
                # non-partial event re-sends the full accumulated text, so
                # replace rather than append to avoid doubling it.
                buffer = buffer + part.text if event.partial else part.text
                yield ("text", buffer, not event.partial)


async def _run_turn(runner, user_id: str, session_id: str, query: str) -> None:
    status = None

    def _start(message: str) -> None:
        nonlocal status
        _stop()
        status = console.status(f"[dim italic]{message}…[/]", spinner="dots")
        status.start()

    def _stop() -> None:
        nonlocal status
        if status is not None:
            status.stop()
            status = None

    # Live-render the current text segment as it streams in; piping stdout
    # to a non-TTY (e.g. `infrapilot "..." | less`) can't handle Live's
    # cursor control codes, so fall back to printing once per segment.
    live_output = console.is_terminal
    live = None
    last_buffer = ""

    def _flush() -> None:
        nonlocal live, last_buffer
        if live is not None:
            live.stop()
            live = None
        elif last_buffer:
            console.print(Markdown(_shorten_links(last_buffer)))
        last_buffer = ""

    _start("Thinking")
    async for kind, *payload in _stream_turn(runner, user_id, session_id, query):
        if kind == "usage":
            continue
        if kind == "call":
            _stop()
            _flush()
            name, args = payload
            console.print(Text(_format_call(name, args), style="dim"))
            _start("Running")
        elif kind == "result":
            _stop()
            _flush()
            (response,) = payload
            console.print(Text(_format_result(response), style="dim"))
            _start("Thinking")
        elif kind == "text":
            _stop()
            buffer, final = payload
            last_buffer = buffer
            if live_output:
                if live is None:
                    live = Live(console=console, refresh_per_second=16, transient=False)
                    live.start()
                live.update(Markdown(_shorten_links(buffer)))
            if final:
                _flush()
    _stop()
    _flush()


async def _make_runner():
    from google.adk.runners import InMemoryRunner

    from InfraPilot.agent import root_agent

    runner = InMemoryRunner(agent=root_agent, app_name="infrapilot")
    user_id, session_id = "local", "cli"
    await runner.session_service.create_session(
        app_name="infrapilot", user_id=user_id, session_id=session_id
    )
    return runner, user_id, session_id


async def _one_shot(query: str) -> None:
    runner, user_id, session_id = await _make_runner()
    await _run_turn(runner, user_id, session_id, query)


def main() -> None:
    query = " ".join(sys.argv[1:]).strip()
    try:
        if query:
            # One-shot stays plain-console: pipeable/scriptable output, no
            # full-screen app to get in the way of `infrapilot "..." | ...`.
            asyncio.run(_one_shot(query))
        else:
            import tui

            tui.run()
    except Exception as exc:
        sys.exit(f"Error: {exc}")


if __name__ == "__main__":
    main()
