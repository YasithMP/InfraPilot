"""Interactive `infrapilot` screen: a real TUI (Textual), not a print/input
loop — scrolling conversation pane, a bordered input bar whose border color
reflects generation state, a status line, and a real footer with model/token
usage, the same shape as Claude Code / Codex CLI / Copilot CLI / pi.

Uses Textual's "ansi-dark" theme: everything renders in the terminal's own
16-color palette with a transparent background, instead of Textual's default
custom-truecolor theme painting over the terminal's own colors.
"""
from __future__ import annotations

from rich.markdown import Markdown
from rich.text import Text
from textual import events, work
from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.message import Message
from textual.widgets import Header, RichLog, Static, TextArea

from cli import _format_call, _format_result, _make_runner, _shorten_links, _stream_turn


class ChatInput(TextArea):
    """Multi-line prompt box: plain Input silently keeps only the first
    line of a pasted block (Textual's Input._on_paste truncates at the
    first newline), so a pasted paragraph or file quietly loses everything
    after line one. TextArea keeps the whole paste; Enter submits instead
    of inserting a newline, Shift+Enter/Ctrl+J inserts one when needed.
    """

    class Submitted(Message):
        def __init__(self, value: str) -> None:
            self.value = value
            super().__init__()

    async def _on_key(self, event: events.Key) -> None:
        if event.key not in ("shift+enter", "ctrl+j", "enter"):
            return await super()._on_key(event)
        event.stop()
        event.prevent_default()
        if event.key == "enter":
            self.post_message(self.Submitted(self.text))
        else:
            self.insert("\n")


class InfraPilotApp(App):
    CSS = """
    Screen {
        background: transparent;
    }
    RichLog {
        margin: 0 1;
        background: transparent;
    }
    #streaming {
        margin: 0 1;
        background: transparent;
    }
    #status {
        height: 1;
        margin: 0 2;
        color: $text-muted;
        background: transparent;
    }
    ChatInput {
        margin: 0 1;
        height: auto;
        max-height: 10;
        border: round $border;
        background: transparent;
    }
    ChatInput:focus {
        border: round $accent;
    }
    ChatInput.thinking {
        border: round $warning;
    }
    #statusbar {
        height: 1;
        dock: bottom;
        background: transparent;
        color: $text-muted;
        padding: 0 1;
    }
    """
    BINDINGS = [("ctrl+c", "quit", "Quit")]
    TITLE = "InfraPilot"
    SUB_TITLE = "IaC copilot"

    def __init__(self) -> None:
        super().__init__()
        self.theme = "ansi-dark"
        self._runner = None
        self._user_id = None
        self._session_id = None
        self._model = ""
        self._tokens_in = 0
        self._tokens_out = 0

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield RichLog(id="log", wrap=True, markup=False, highlight=False)
            yield Static("", id="streaming")
            yield Static("", id="status")
            yield ChatInput(
                id="prompt",
                placeholder="Ask InfraPilot to design or scaffold something...",
            )
        yield Static(id="statusbar")

    def _refresh_statusbar(self) -> None:
        self.query_one("#statusbar", Static).update(
            f"{self._model}   ↑ {self._tokens_in} ↓ {self._tokens_out}   ctrl+c quit"
        )

    async def on_mount(self) -> None:
        self._runner, self._user_id, self._session_id = await _make_runner()
        self._model = self._runner.agent.model
        self._refresh_statusbar()
        log = self.query_one("#log", RichLog)
        log.write(Text("Welcome to InfraPilot", style="bold"))
        log.write(Text("Terraform, OpenTofu, Pulumi, and Bicep across AWS/Azure/GCP.", style="dim"))
        log.write(Text("Type a request below. Enter to send, Shift+Enter for a new line.", style="dim"))
        log.write(Text("Ctrl+C to quit.", style="dim"))
        self.query_one(ChatInput).focus()

    async def on_chat_input_submitted(self, event: ChatInput.Submitted) -> None:
        query = event.value.strip()
        self.query_one(ChatInput).text = ""
        if not query:
            return
        if query in ("exit", "quit"):
            self.exit()
            return
        log = self.query_one("#log", RichLog)
        log.write(Text(f"> {query}", style="bold"))
        self._run_turn(query)

    @work(exclusive=True)
    async def _run_turn(self, query: str) -> None:
        log = self.query_one("#log", RichLog)
        streaming = self.query_one("#streaming", Static)
        status = self.query_one("#status", Static)
        prompt = self.query_one(ChatInput)
        prompt.disabled = True
        prompt.add_class("thinking")
        status.update("[dim italic]Thinking…[/]")

        last_buffer = ""

        def flush() -> None:
            nonlocal last_buffer
            if last_buffer:
                log.write(Markdown(_shorten_links(last_buffer)))
                streaming.update("")
            last_buffer = ""

        try:
            async for kind, *payload in _stream_turn(
                self._runner, self._user_id, self._session_id, query
            ):
                if kind == "usage":
                    (usage,) = payload
                    self._tokens_in += usage.prompt_token_count or 0
                    self._tokens_out += usage.candidates_token_count or 0
                    self._refresh_statusbar()
                elif kind == "call":
                    status.update("")
                    flush()
                    name, args = payload
                    log.write(Text(_format_call(name, args), style="dim"))
                    status.update("[dim italic]Running…[/]")
                elif kind == "result":
                    status.update("")
                    flush()
                    (response,) = payload
                    response_status = (
                        response.get("status") if isinstance(response, dict) else None
                    )
                    result_style = {
                        "success": "green",
                        "error": "red",
                    }.get(response_status, "dim")
                    log.write(Text(_format_result(response), style=result_style))
                    status.update("[dim italic]Thinking…[/]")
                elif kind == "text":
                    status.update("")
                    buffer, final = payload
                    last_buffer = buffer
                    streaming.update(Markdown(_shorten_links(buffer)))
                    if final:
                        flush()
        except Exception as exc:  # model/network errors shouldn't kill the session
            flush()
            log.write(Text(f"Error: {exc}", style="red"))
        finally:
            flush()
            status.update("")
            prompt.remove_class("thinking")
            prompt.disabled = False
            prompt.focus()
            log.write("")


def run() -> None:
    InfraPilotApp().run()
