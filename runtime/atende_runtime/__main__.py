"""CLI: validação local sem credenciais e servidor Twilio opcional."""

from __future__ import annotations

import argparse
import html
import json
import logging
from pathlib import Path

from .tree.interpreter import TreeSession
from .tree.types import validate_tree


def selftest(tree_path: str = "data/tree.dev.json") -> int:
    path = Path(tree_path)
    if not path.is_file():
        path = Path(__file__).parent / tree_path
    tree = validate_tree(json.loads(path.read_text(encoding="utf-8")))
    session = TreeSession.start(tree)
    greeting = session.render_speech({"clinica": "Clínica Exemplo"})
    if "Clínica Exemplo" not in greeting or "assistente virtual" not in greeting:
        raise RuntimeError("A saudação de teste não corresponde ao esperado")
    target = session.transition({"motivo": "urgente"})
    if target != "triagem_urgente":
        raise RuntimeError(f"Transição inesperada: {target}")
    if session.continue_after_action() != "transferir_humano":
        raise RuntimeError("Destino de transferência inesperado")
    print(f"selftest ok: {path}; saudação, DSL e transições validadas")
    return 0


def serve() -> int:
    from fastapi import FastAPI, WebSocket
    from fastapi.responses import Response
    import uvicorn

    from .config import get_settings
    from .pipeline.hello import run_websocket

    settings = get_settings()
    app = FastAPI(title="atende-ia voice runtime")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/twiml")
    async def twiml() -> Response:
        xml = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            "<Response><Connect><Stream url=\""
            + html.escape(settings.public_wss_url, quote=True)
            + "\" /></Connect></Response>"
        )
        return Response(content=xml, media_type="application/xml")

    @app.websocket("/ws")
    async def twilio_media_stream(websocket: WebSocket) -> None:
        await websocket.accept()
        try:
            start_message = None
            while start_message is None:
                message = await websocket.receive_json()
                if message.get("event") == "start":
                    start_message = message.get("start") or {}
            if not start_message.get("streamSid") or not start_message.get("callSid"):
                raise ValueError("Evento start da Twilio sem streamSid/callSid")
            await run_websocket(websocket, settings, start_message)
        except Exception:
            logging.exception("Falha no pipeline de voz")
            await websocket.close(code=1011)

    uvicorn.run(app, host="0.0.0.0", port=settings.port)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="atende_runtime")
    parser.add_argument("command", choices=("selftest", "serve"), nargs="?", default="selftest")
    parser.add_argument("--tree", default="data/tree.dev.json")
    args = parser.parse_args()
    return selftest(args.tree) if args.command == "selftest" else serve()


if __name__ == "__main__":
    raise SystemExit(main())
