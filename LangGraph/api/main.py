"""Small HTTP service for Docker Compose. Notebooks and scripts under `agent/` stay for local use."""

from fastapi import FastAPI

app = FastAPI(title="LangGraph playground", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "service": "LangGraph",
        "docs": "/docs",
        "note": "Agent notebooks and Python scripts live in agent/; run them locally or extend this API.",
    }
