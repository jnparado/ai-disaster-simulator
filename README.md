# AI Disaster Impact Simulator

AI-powered disaster prediction platform for **Davao City**. Simulates flood, earthquake, fire, and power outage scenarios with impact predictions, evacuation planning, and an interactive Mapbox map.

> **Disclaimer:** All outputs are predictive estimates for planning purposes — not official government alerts.

## Features

- **Digital Twin** — Davao City infrastructure model (barangays, hospitals, roads, rivers, grid)
- **4 Disaster Types** — Flood, earthquake, fire, power outage
- **Interactive Timeline** — Scrub from current to 3 days later with play mode
- **Mapbox Map** — Real coordinates, calamity epicenter, affected zones, evacuation routes
- **Environmental Controls** — Rainfall (flood), wind direction (fire)
- **Evacuation Planner** — Mapbox Directions API routes drawn on map
- **AI Assistant** — Rule-based Q&A; optional OpenAI LLM integration
- **Scenario Sharing** — URL encodes full scenario state
- **Export** — JSON situation report + GeoJSON impact layers

## Quick Start

```bash
cp .env.example .env.local
# Add your Mapbox token to .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Yes | Mapbox token for map + directions |
| `NEXT_PUBLIC_APP_NAME` | No | App display name |
| `NEXT_PUBLIC_DEFAULT_DISASTER` | No | Default disaster type (`flood`) |
| `AI_ASSISTANT_ENABLED` | No | Enable OpenAI assistant (`false`) |
| `OPENAI_API_KEY` | No | OpenAI API key for LLM assistant |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |
| `ALERT_PHONE_NUMBER` | No | Default phone for SMS alerts (server) |
| `NEXT_PUBLIC_ALERT_PHONE` | No | Phone pre-filled in alert UI |
| `SEMAPHORE_API_KEY` | For SMS | [Semaphore](https://semaphore.co) — recommended for PH numbers |
| `TWILIO_*` | For SMS | Twilio credentials (alternative) |

## SMS Calamity Alerts

1. Open the **SMS Calamity Alerts** panel in the dashboard sidebar
2. Click **Enable SMS Alerts** — sends a test message to your number
3. Allow location access (or uses Davao center as fallback)
4. When a simulated calamity is within the impact zone near you, an SMS is sent

Without an SMS provider configured, alerts are logged to the server console in development.
Add `SEMAPHORE_API_KEY` for real SMS to Philippine numbers.

### `POST /api/alerts/subscribe`

Send test SMS and activate alerts.

### `POST /api/alerts/check`

Check proximity and send alert if calamity is near user location.


### `POST /api/simulate`

Run simulation with validated parameters.

```json
{
  "disasterType": "flood",
  "intensity": 0.75,
  "timelineStep": "+3h",
  "rainfall": 120,
  "windDirection": 45
}
```

### `POST /api/assistant`

Ask the emergency assistant about the current scenario.

```json
{
  "question": "How many rescue boats are needed?",
  "params": { "disasterType": "flood", "intensity": 0.75, "timelineStep": "+3h" }
}
```

## Project Structure

```
src/
  app/              Next.js app + API routes
  components/       Dashboard UI
  lib/
    digital-twin/   City data model
    simulation/     Disaster prediction engine
    geo/            Coordinates, map layers, evacuation routes
    assistant/      Q&A engine + optional LLM
    export/         Report & GeoJSON export
    scenario/       URL state encoding
```

## Calamity Epicenters (Davao City)

| Disaster | Location |
|----------|----------|
| Flood | Davao River overflow — 7.048°N, 125.468°E |
| Earthquake | Matina fault — 7.078°N, 125.512°E |
| Fire | Sasa Industrial Zone — 7.082°N, 125.618°E |
| Power Outage | Central Grid Substation — 7.092°N, 125.542°E |

## License

Private — for emergency planning demonstration purposes.
# ai-disaster-simulator
