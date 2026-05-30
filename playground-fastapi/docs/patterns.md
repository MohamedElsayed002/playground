# Backend Architecture 

## Domain-Driven Design (DDD)

- Why: Stop writing messy service files
- You learn: how to structure large systems
- You build: clean modules like `users`, `payments`, `files`

## Event-Driven Architecture

- Why: decouple everything (very powerful)
- Example
    - User uploads PDF -> event triggers parsing -> event triggers AI extraction

## API Versioning & Backward Compatibility

- Why: real apps never break old clients
- You build
    - `/api/v1/..`
    - `/api/v2/..`

## Caching Strategies (Redis deep dive)

- Why: performance x10
- Concepts  
    - cache-aside
    - write-through
- You build
    - cache PDF parsing results


---

# Performance & Scalability

## Load testing

- Tools like k6
- Why: know when your app break
- You test
    - 1000 users uploading PDFs

## Concurrency & Async Internals

- Why: understand FastAPI deeply
- Concepts
    - event loop
    - blocking vs non-blocking

## Database Optimization 

- Indexing 
- Query tuning
- N+1 problem

---

# Security 

## Authentication Architecture

- JWT vs Sessions
- Refresh tokens
- Token rotation

## OWASP Top 10

- SQL Injection 
- XSS
- CSRF

## Rate Limiting 

- Prevent abuse / DDoS


---

# Real production debugging workflow

When API becomes slow, ask:

**Is it blocking**

Search code for:

- `requests`
- `time.sleep`
- `open(...).read()`
- `syncSDKs`
- parsing libraries
- CPU-heavy loops


**Is DB waiting**

Look for

- long transactions
- connection pool saturation
- external calls between DB queries

**Is external dependency slow?**

Check

- payment APIs
- auth provider
- storage provider
- AI API 
- Redis


---

**Very practical mental model**

A request usually spends time in one of 3 places

Waiting on I/O
database, network, redis

-> async is ideal

Doing CPU Work

PDF parsing, image processing, large JSON, hashing
-> threadpool / workers

Waiting because something else is blocked
connection pool, external service, queue

-> architecture problem