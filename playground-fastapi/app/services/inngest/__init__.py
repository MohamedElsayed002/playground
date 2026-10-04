from app.services.inngest.client import inngest_client
from app.services.inngest.dispatch import (
    send_checkout_background_jobs,
    send_flash_sale_payment_job,
    send_order_payment_succeeded_job,
)
from app.services.inngest.functions.checkout_background import (
    checkout_background_jobs,
    send_paid_order_invoice,
)
from app.services.inngest.functions.pdf_upload import process_pdf_upload
from app.services.inngest.functions.csv_uploaded import process_csv_upload
from app.services.inngest.functions.flash_sale import flash_sale_payment

inngest_functions = [
    process_pdf_upload,
    checkout_background_jobs,
    send_paid_order_invoice,
    process_csv_upload,
    flash_sale_payment,
]

__all__ = [
    "inngest_client",
    "send_checkout_background_jobs",
    "send_flash_sale_payment_job",
    "send_order_payment_succeeded_job",
    "inngest_functions",
]
