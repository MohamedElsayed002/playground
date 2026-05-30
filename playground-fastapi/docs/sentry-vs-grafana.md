# Sentry vs Grafana

## Sentry -> Something broke, fix it

- Focus errors & exceptions
- Captures
    - stack traces
    - request data
    - user context
    - breadcrumbs (what happened before crash)
- Alert you when things fail

Think debugging production crashes

---

## Grafana -> What happening overtime?

- Focus metrics & monitoring 
- Work with
    - Prometheus (metrics)
    - Loki (logs)
    - Tempo
- Shows dashboard 
    - CPU usage
    - request latency 
    - error rates
    - traffic patterns

Think system health & performance

---

Data integrity = your data is always correct, consistent, and trustworthy - no matter what happens

### What strong systems do 

- strict response schemas
- strict DB constraints 
- rollback on failure 
- no duplicates
- no invalid states

### Summary in one sentence

Data integrity = making sure your system never lies, even when things fail

## Background job retries
Problem
Job fails -> retried

Without protection
- process same file twice
- duplicate AI extraction

