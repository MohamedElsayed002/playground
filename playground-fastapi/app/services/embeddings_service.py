import asyncio 
import logging
from functools import lru_cache 
from typing import TYPE_CHECKING

import numpy as np

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

MODEL_NAME = "all_MiniLM-L6-V2"

_model: "SentenceTransformer | None" = None


def get_model() -> "SentenceTransformer":
    global _model 
    if _model is None:
        try: 
            from sentence_transformers import SentenceTransformer  # pip install sentence-transformers
            logger.info("Loading embedding model '%s' ...", MODEL_NAME)
            _model = SentenceTransformer(MODEL_NAME)
            logger.info("Embedding model loaded")
        except ImportError:
            raise RuntimeError(
                "Sentence-transformers is not installed"
                "Run pip install sentence-transformers"
            )
    return _model



def build_cv_embedding_text(
        full_text: str,
        name: str | None,
        skills: list[str],
        job_titles: list[str],
        summary: str | None
) -> str:
    """
        
    """

    parts: list[str] = []

    if name:
        parts.append(f"Candidate: {name}")
    if summary:
        parts.append(summary[:500])
    if skills:
        skills_text = ", ".join(skills[:40])
        parts.append(f"Skills: {skills_text}")
        parts.append(f"Expertise: {skills_text}")
    if job_titles:
        parts.append("Experience: " + " | ".join(job_titles[:5]))
    return "\n".join(parts)

def _encode_sync(text: str) -> list[float]:
    model = get_model()
    vector: np.ndarray = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


async def encode(text: str) -> list[float]:
    """
        Async wrapper - runs the CPU-bound encode in a thread pool
        so FastAPI's event loop is never blocked
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None,_encode_sync,text)

async def encode_cv(
        full_text: str,
        name: str | None = None,
        skills: list[str] | None = None,
        job_titles: list[str] | None = None,
        summary: str | None = None
) -> list[float]:
    """
        High level entry point: build embedding text then encode
    """
    emb_text = build_cv_embedding_text(
        full_text=full_text,
        name=name,
        skills=skills or [],
        job_titles=job_titles or [],
        summary=summary
    )

    return await encode(emb_text)


# ──────────────────────────────────────────────
# Cosine similarity helper (for in-memory fallback)
# ──────────────────────────────────────────────

def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
