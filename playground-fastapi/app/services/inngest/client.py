import logging

import inngest

from app.core.config import settings

logger = logging.getLogger("uvicorn")

_is_production = settings.INNGEST_SIGNING_KEY not in (None, "", "local-dev-key")

inngest_client = inngest.Inngest(
    app_id="playground_fastapi",
    logger=logger,
    is_production=_is_production,
    signing_key=settings.INNGEST_SIGNING_KEY if _is_production else None,
    event_key=settings.INNGEST_EVENT_KEY if _is_production else None,
)
