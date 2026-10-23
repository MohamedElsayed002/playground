from datetime import datetime, timezone

from app.core.datetime_utils import as_utc_datetime
from app.models.flash_sale import FlashSale


def sale_window_is_open(
    flash_sale: FlashSale,
    now: datetime | None = None,
) -> bool:
    current_time = now or datetime.now(timezone.utc)
    starts_at = as_utc_datetime(flash_sale.starts_at)
    ends_at = as_utc_datetime(flash_sale.ends_at)
    return starts_at <= current_time <= ends_at
