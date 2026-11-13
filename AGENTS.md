# AGENTS.md

## Project

Voice reception SaaS for dental and physiotherapy clinics in Brazilian Portuguese. The repository contains a Fastify/TypeScript API at the root and a Python/Pipecat voice runtime in `runtime/`.

## Commands

- API: `pnpm install`, `pnpm dev`, `pnpm format:check`, `pnpm typecheck:tests`, `pnpm build`, `pnpm test`
- Runtime: from `runtime/`, `uv sync`, `uv run python -m atende_runtime selftest`, `uv run pytest`
- Local PostgreSQL: `docker compose up -d postgres` (host port 5433)

## API architecture

- `src/domain`: framework-free entities, errors and repository ports.
- `src/usecases`: application rules.
- `src/interfaces`: Fastify and gRPC driving adapters and presenters.
- `src/infrastructure`: PostgreSQL adapters, configuration and observability.
- Keep imports pointed inward. Use constructor injection and validate HTTP input with Fastify JSON schemas.
- ESM relative TypeScript imports include `.js` extensions.
- Regenerate gRPC sources with `pnpm proto:generate`; never edit generated files by hand.
- Keep API tests in `tests/`; use fakes for HTTP E2E and a real ephemeral gRPC server for gRPC E2E.

## Runtime architecture

- `runtime/atende_runtime/tree` is deterministic DSL validation/interpreter code and must not depend on provider SDKs.
- `runtime/atende_runtime/pipeline` owns Pipecat and provider integration.
- `python -m atende_runtime selftest` must remain usable without credentials.
- Never commit `.env` files or secrets. Runtime provider configuration is validated on startup.

## Current limitations

This is an early MVP scaffold. API routes do not have authentication. The runtime pipeline has not yet been verified against live provider credentials; Twilio request signature validation and real call transfer are still required before a public pilot. Keep these limitations explicit in documentation until resolved.
