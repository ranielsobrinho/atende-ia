# Runtime de voz

Runtime Python 3.13 do atende-ia. A semana 1 mantém a árvore local para testar o fluxo sem
dependência da API; o carregamento de árvore por tenant e a execução completa da DSL serão
integrados nas próximas etapas.

## Preparação

```bash
cd runtime
cp .env.example .env
uv sync
uv run python -m atende_runtime selftest
uv run pytest
```

O `selftest` valida a árvore de desenvolvimento e uma transição de urgência sem carregar
Pipecat ou exigir credenciais. Para servir Twilio Media Streams, preencha as credenciais em
`.env` e execute `uv run python -m atende_runtime serve`. Configure o webhook de voz da Twilio
para `POST https://<host>/twiml`; a rota responde com `<Connect><Stream>` apontando para
`PUBLIC_WSS_URL` (por exemplo, `wss://<host>/ws`). Em desenvolvimento, use um túnel HTTPS.
O endpoint `/health` verifica apenas se o servidor está vivo.

Variáveis exigidas no modo `serve`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_PHONE_NUMBER`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `OPENAI_API_KEY` e
`PUBLIC_WSS_URL`.
Configuração incompleta falha ao iniciar. Nunca coloque segredos no arquivo da árvore ou no Git.

## Árvore de diálogo

`atende_runtime/tree` não depende de serviços externos. A validação verifica referências de
nós e a presença de uma rota de fallback para transferência humana. A sessão resolve condições
de igualdade simples sobre slots, aceita enumerações fechadas e slots `FREE_TEXT`, aplica o
limite de duas falhas e renderiza placeholders como `{clinica}`. Expressões de condição mais
ricas, regras completas de alcance da árvore e integração do interpretador no pipeline de áudio
ficam para a semana 2.

## Segurança e operação

Não há persistência de chamadas/transcrições nesta etapa. Antes de beta: validar assinatura
Twilio no ingresso, implementar transferência real de chamada, obter consentimento explícito
para gravação, proteger dados de saúde, armazenar segredos num gerenciador e adicionar limites
de duração/conexões.
