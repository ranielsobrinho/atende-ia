# atende-ia

SaaS de recepção de voz com IA em português brasileiro para clínicas odontológicas e de fisioterapia. A chamada é atendida pelo runtime Python com Pipecat; a API Fastify mantém tenants e árvores de diálogo. O MVP está em desenvolvimento e ainda não está pronto para uso em clínicas.

## Estado atual

- API Fastify com criação de tenants e criação, listagem e consulta de árvores de diálogo.
- PostgreSQL 16 com schema para tenants, árvores versionadas, chamadas, transcrições e mensagens WhatsApp.
- Endpoint gRPC para consultar uma árvore por ID.
- Runtime Python com validação e interpretação inicial da DSL, `selftest` sem credenciais e pipeline em construção para Twilio Media Streams, ElevenLabs e OpenAI.
- A aplicação ainda não tem autenticação, motor FSM completo, agenda, persistência de chamadas/transcrições pelo runtime, WhatsApp, editor visual ou billing.

## Requisitos

- Node.js 24 e pnpm 11
- Docker Compose
- Python 3.13 e uv para o runtime

## Iniciar a API

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm dev
```

O Postgres local publica a porta `5433` no host. A API REST escuta na porta configurada por `PORT` (padrão `3000`) e gRPC na `GRPC_PORT` (padrão `50051`). O Swagger fica em `/docs`; a verificação de saúde em `/health`.

Rotas implementadas:

| Método | Caminho                           | Descrição                            |
| ------ | --------------------------------- | ------------------------------------ |
| `POST` | `/api/v1/tenants`                 | Cria tenant de desenvolvimento       |
| `POST` | `/api/v1/call-trees`              | Cria árvore para um tenant existente |
| `GET`  | `/api/v1/call-trees?tenantId=...` | Lista árvores do tenant              |
| `GET`  | `/api/v1/call-trees/:id`          | Consulta árvore por ID               |
| `GET`  | `/health`                         | Saúde da API e do banco              |

As rotas ainda não exigem autenticação. Não as exponha publicamente.

### Verificações da API

```bash
pnpm format:check
pnpm typecheck:tests
pnpm build
pnpm test
```

## Iniciar o runtime

```bash
cd runtime
uv sync
uv run python -m atende_runtime selftest
uv run pytest
```

O `selftest` não precisa de credenciais. Para servir chamadas, copie `runtime/.env.example` para `runtime/.env`, configure as credenciais de Twilio, ElevenLabs e OpenAI e `PUBLIC_WSS_URL`, depois execute `uv run python -m atende_runtime serve`. Configure o webhook de voz da Twilio para `POST /twiml` e o endereço WSS para `/ws`.

O pipeline de voz e as integrações externas ainda precisam de teste com dependências instaladas e credenciais reais. Antes de qualquer piloto também será necessário validar assinatura dos webhooks Twilio, transferência para atendente, consentimento para gravação e proteção de dados de saúde.

## Arquitetura

```text
Twilio Media Streams → Runtime Python / Pipecat → STT / LLM / TTS
                              │
                              └── API Fastify → PostgreSQL
```

O runtime carrega uma árvore local nesta primeira etapa. Integração para carregar árvore por tenant, FSM completa, Google Calendar, armazenamento de chamadas/transcrições e envio de áudio por WhatsApp estão planejados para as próximas etapas do MVP.

O contrato gRPC está em [`proto/call_tree.proto`](./proto/call_tree.proto). O plano aprovado e os critérios das etapas estão em [`docs/superpowers/plans/2026-10-21-mvp-plan.md`](./docs/superpowers/plans/2026-10-21-mvp-plan.md).
