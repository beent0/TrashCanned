# TrashCanned — código (Fase 3)

Decisões de arquitetura: `../Phase 3/Resources/TrashCanned_Fase3_Decisoes.pdf`. API: `../Phase 3/Resources/APIs/openapi_v5.yaml`.

| Pasta | Conteúdo |
|---|---|
| `backend/` | NestJS. Um só código, três deployments: `SERVICE=experience\|core\|monitorizacao` escolhe o módulo raiz (`src/<service>/`). Prefixo `/api/v1`, `GET /api/v1/health` em todos. |
| `frontend/` | React + Vite + TypeScript. Em produção é servido pelo `experience`. |
| `simulator/` | Simulador de sensores (MQTT.js): publica em `sensores/{sensor_id}/leitura`. |
| `mosquitto/` | Configuração do Eclipse Mosquitto 2 (desenvolvimento). |
| `Dockerfile` | Uma imagem por deployment: `docker build --target experience\|core\|monitorizacao .` |

## Correr tudo

```sh
cd main
docker compose up --build
```

- Aplicação: http://localhost:8080 (experience, serve o React e `/api/v1`)
- PostgreSQL 16: `localhost:5432` (credenciais em `.env.example`)
- Mosquitto: `localhost:1883` (sem TLS nem autenticação até ao KAN-56)

## Desenvolver sem Docker

```sh
cd main/backend && npm ci && SERVICE=experience PORT=8080 npm run start:dev
cd main/frontend && npm ci && npm run dev   # proxy /api e /ws para :8080
```

Testes: `npm test` e `npm run test:e2e` em `backend/`; `npm run lint` em cada pasta.

## Regras de trabalho

- `main` está protegido: tudo entra por pull request, com 1 revisão e o CI verde.
- Ramos: `<tipo>/KAN-<n>-<descricao>` (ex.: `feat/KAN-27-consumidor-leituras`). Tipos: `feat`, `fix`, `chore`, `docs`, `test`.
- Commits em Conventional Commits, com a chave do Jira (ex.: `feat(monitorizacao): KAN-27 consumir leituras`).
- Definition of Done: código revisto, testes a passar, lint sem erros, OpenAPI atualizado se a API mudou, decisão nova registada no documento de decisões da Fase 3, tarefa do Jira movida para Concluído.
