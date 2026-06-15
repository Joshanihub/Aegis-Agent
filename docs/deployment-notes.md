# Deployment Notes & Secrets Audit

## Deployment Strategy

Aegis Agent is designed to be deployed as two distinct services:
1. **Frontend**: Next.js 14 application hosted on Vercel or a standard Node.js container.
2. **Backend**: FastAPI Python application hosted on AWS ECS, Google Cloud Run, or a similar containerized environment.

### Frontend Deployment (Vercel)
- Connect the repository to Vercel.
- Set Framework Preset to Next.js.
- Ensure the `NEXT_PUBLIC_WS_URL` environment variable points to the production backend WebSocket endpoint.

### Backend Deployment (Docker)
A sample `Dockerfile` should be used to build the backend image.
- **Port**: Expose port 8000.
- **Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
- **Scaling**: Since WebSockets are stateful, if scaling horizontally, consider adding a Redis backplane for pub/sub if rooms span multiple instances (currently rooms are held in local memory).

---

## Secrets Audit

Before deploying to production, ensure the following secrets are securely stored (e.g., AWS Secrets Manager, GitHub Secrets, Vercel Env Vars) and **NEVER** committed to version control.

### Required Environment Variables

| Variable Name | Component | Description | Status |
|---------------|-----------|-------------|--------|
| `NEXT_PUBLIC_WS_URL` | Frontend | URL for the backend WebSocket endpoint (e.g., wss://api.example.com/ws). | Required |
| `BAND_API_KEY_PLANNER` | Backend | API Key for the Planner agent. | Required |
| `BAND_API_KEY_ANALYST` | Backend | API Key for the Analyst agent. | Required |
| `BAND_API_KEY_REVIEWER`| Backend | API Key for the Reviewer agent. | Required |
| `BAND_API_KEY_FINALIZER`| Backend | API Key for the Finalizer agent. | Required |
| `BAND_MOCK_MODE` | Backend | Set to `false` for production to enable real Band API calls. | Required |
| `OPENAI_API_KEY` | Backend | (Fallback) OpenAI API key for evaluation and routing if needed. | Optional |

**Audit Checklist**:
- [x] Verified `.env` is in `.gitignore`
- [x] Ensure `config.py` does not contain hardcoded fallback keys
- [x] Validate all backend agent configurations pull from env vars securely
