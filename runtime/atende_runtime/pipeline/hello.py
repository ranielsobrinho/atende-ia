"""Pipeline de voz por Twilio Media Streams (dependências externas carregadas sob demanda)."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def build_pipeline(websocket: Any, settings: Any, start_message: dict[str, Any]) -> tuple[Any, Any, Any, Any]:
    """Cria pipeline Twilio → ElevenLabs STT → OpenAI → ElevenLabs TTS → Twilio."""
    try:
        from pipecat.pipeline.pipeline import Pipeline
        from pipecat.pipeline.worker import PipelineParams, PipelineWorker
        from pipecat.processors.aggregators.llm_context import LLMContext
        from pipecat.processors.aggregators.llm_response_universal import (
            LLMContextAggregatorPair,
            LLMUserAggregatorParams,
        )
        from pipecat.audio.vad.silero import SileroVADAnalyzer
        from pipecat.serializers.twilio import TwilioFrameSerializer
        from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService
        from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
        from pipecat.services.openai.llm import OpenAILLMService
        from pipecat.transcriptions.language import Language
        from pipecat.transports.websocket.fastapi import (
            FastAPIWebsocketParams,
            FastAPIWebsocketTransport,
        )
        from pipecat.workers.runner import WorkerRunner
    except ImportError as exc:
        raise RuntimeError("Instale as dependências de voz com `uv sync`.") from exc

    serializer = TwilioFrameSerializer(
        stream_sid=start_message["streamSid"],
        call_sid=start_message["callSid"],
        account_sid=settings.twilio_account_sid,
        auth_token=settings.twilio_auth_token.get_secret_value(),
        params=TwilioFrameSerializer.InputParams(auto_hang_up=False),
    )
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            serializer=serializer,
            allowed_origins=[],
        ),
    )
    stt = ElevenLabsRealtimeSTTService(
        api_key=settings.elevenlabs_api_key.get_secret_value(),
        settings=ElevenLabsRealtimeSTTService.Settings(language=Language.PT),
    )
    llm = OpenAILLMService(
        api_key=settings.openai_api_key.get_secret_value(),
        settings=OpenAILLMService.Settings(
            model="gpt-4o-mini",
            system_instruction="Você é uma recepcionista virtual de clínica no Brasil. Fale em português brasileiro, com clareza e brevidade. Identifique-se como assistente virtual e nunca dê orientação médica."
        ),
    )
    tts = ElevenLabsTTSService(
        api_key=settings.elevenlabs_api_key.get_secret_value(),
        settings=ElevenLabsTTSService.Settings(
            voice=settings.elevenlabs_voice_id, language=Language.PT
        ),
    )
    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )
    worker = PipelineWorker(pipeline, params=PipelineParams(enable_metrics=True))
    runner = WorkerRunner()
    return worker, runner, context, transport


async def run_websocket(websocket: Any, settings: Any, start_message: dict[str, Any]) -> None:
    """Executa uma conversa vinculada a uma conexão Twilio."""
    from pipecat.frames.frames import LLMRunFrame

    worker, runner, context, transport = build_pipeline(websocket, settings, start_message)
    await runner.add_workers(worker)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport: Any, _client: Any) -> None:
        context.add_message(
            {"role": "developer", "content": "Apresente-se em português brasileiro como assistente virtual da clínica."}
        )
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport: Any, _client: Any) -> None:
        await runner.cancel()

    await runner.run()
