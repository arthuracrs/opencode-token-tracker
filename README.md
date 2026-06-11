# Token Tracker

Track token usage and costs across opencode AI sessions, per project and model.

## Architecture

```
                    ┌─────────────┐
                    │  opencode   │
                    │   plugin    │
                    └──────┬──────┘
                           │ POST /api/usage
                    ┌──────▼──────┐
                    │   Server    │  Express + TypeScript
                    │  :3838      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌────▼────┐
     │ PostgreSQL │ │  /api/    │ │  Frontend│
     │  (usage +  │ │  stats    │ │  HTML    │
     │  pricing)  │ │  costs    │ │          │
     └────────────┘ │  pricing  │ └─────────┘
                    └───────────┘
```

## Quick Start

```bash
# Start PostgreSQL
docker compose -f infra/docker-compose.yml up -d postgres

# Run database migrations
docker compose -f infra/docker-compose.yml up liquibase

# Install server dependencies
cd server && npm install

# Start the server
npm run dev
```

Open http://localhost:3838

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3838` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `tokentracker` | Database user |
| `DB_PASSWORD` | `tokentracker` | Database password |
| `DB_NAME` | `tokentracker` | Database name |

## API

### `POST /api/usage`
Submit token usage from the opencode plugin.

### `GET /api/stats`
Aggregated stats per project (requests, tokens, first/last usage).

### `GET /api/costs`
Usage with cost estimates per project and per model, calculated from pricing data.

### `GET /api/pricing`
Current model pricing data from the database.

### `POST /api/estimate-cost`
Calculate cost for arbitrary token amounts.

## opencode Plugin

The `token-tracker` plugin in `.opencode/plugins/` sends usage data to the server automatically during opencode sessions.

To use it, add to your opencode config:

```json
{
  "plugins": [".opencode/plugins/token-tracker.ts"]
}
```

## Database

Schema managed via [Liquibase](https://www.liquibase.com/):

- `model_pricing` — per-model token prices with effective date ranges
- `token_usage` — per-request token counts and costs

## License

MIT
