# Aegis Agent

> Enterprise multi-agent workflow command center for automated investment analysis and risk assessment.

Aegis Agent coordinates a band of AI agents (Planner, Analyst, Reviewer, Finalizer) to perform deep-dive diligence on companies. It features a cinematic, Framer Motion-powered "War Room" UI to visualize the agent reasoning chain in real time via WebSockets.

---

## Architecture

Aegis is split into three main layers:

### 1. Frontend (Next.js 14 App Router)
- **Tech Stack**: React 18, TypeScript, Tailwind CSS v3, Framer Motion, Zustand
- **Design System**: "Luminous Workspace" (dark mode, glassmorphism, semantic accents)
- **Features**: Real-time terminal stream, focal blur animations, aperture wipe reveal, SVG risk ring

### 2. Backend (FastAPI / Python)
- **Tech Stack**: Python 3.11+, FastAPI, Pydantic, WebSockets
- **Features**: Asynchronous orchestrator (`orchestrator.py`), Band WebSocket proxy, task state management

### 3. AI Agents (Prompt Engine)
- **Planner**: Decomposes the investment thesis
- **Analyst**: Synthesizes market data
- **Reviewer**: Validates findings (can loop back to Analyst)
- **Finalizer**: Compiles the final dossier and issues a verdict

---

## Local Development

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on port 8000)
uvicorn main:app --reload
```

> Note: The backend uses a local mock environment (`BAND_MOCK_MODE=true` in `.env`) so it can be run without external Band API credentials for local UI development.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server (runs on port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to initialize a new committee room.

---

## API Contract

The full REST and WebSocket API contract between the frontend and backend is documented in [docs/api-contract.md](./docs/api-contract.md).
