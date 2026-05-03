
# Thread Pool - Blocking & Non-Blocking

A server handles many request at once.

When one request is waiting on something slow (database, network, file I/O), the server should work on another request instead of sitting idle 

That is what **non-blocking** means.

A blocking operation keeps the worker busy until it finishes

---

## Event Loop - Simple Version

Think of the event loop as:
    "A  coordinator that keeps checking which task is ready to continue"
It does not run everything simultaneously

It runs tasks in tiny pieces

When a task reaches `await`, it pauses and lets another task run

---

## Typescript / Node.js example

In Node.js this feels natural

```ts
async function handler() {
    const user = await db.user.findUnique()
    return user
}
```

What happens 

- request starts
- DB query sent
- function pauses at await 
- event loop serves other request
- DB returns 
- functions resumes

This is non-blocking

---

FastAPI - same idea

```py
async def get_data():
    user = await db.get_user()
    return user
```

Exactly the same principle

But Python has one big difference 

- not every function inside an `async def` is `async aware`

That is where most confusion begins

---

## The most important rule

Inside `async def`

- await something_async() -> good   
- time.sleep(3) -> blocks everything
- requests.get() -> blocks
- heavy CPU parsing -> blocks

That surprises many people

Declaring a function `async` does not magically make its contents non-lbocking

---

## Example - Blocking in FastAPI

```py
import time 

@app.get("/bad")
async def bad():
    time.sleep(5)
    return {
        "ok": True
    }
```

During those 5 seconds, that worker is occupied

Other request wait

---

### Correct non-blocking version

```py
import asyncio

@app.get("/good")
async def good():
    await asyncio.sleep(5)
    return {
        "ok":True
    }
```

---

### Why this feels easier in Typescript 

In Node, many libraries were designed around async I/O from the beginning 

Examples 

- `fetch`
- database drivers
- HTTP clients

In python, many popular libraries were originally synchronous

Examples

- `request`
- `file parsing libraries`
- images libraries
- PDF parsers

So in FastAPI you often hit:
    "My route is async, but some library inside is blocking"

That is very common

---

## Threadpool- where it fits

A threadpool is:
    "Run blocking code somewhere else so the event loop stays free"
Imagine your PDF Parsing

- reading bytes
- parsing pages
- extracting tables

That may be blocking CPU work.

Instead of doing this directly inside async route


```py
pdf = pdfplumber.open(..)
```

offload it.

FastAPI commonly uses:

```py
from starlette.concurrency import run_in_threadpool

result = await run_in_threadpool(parse_pdf,file_bytes)
```

Now

- request stays async
- blocking parser runs in worker thread 
- event loop remains available

---


## Very Practical rule

Use this in FastAPI

Safe directly in async route

- async DB drivers
- async HTTP clients
- async Redis 
- async queues

Example

- `await db.execute`
- `await httpx.AsyncClient().get(..)`

---

Put in threadpool

- PDF parsing 
- image processing
- CSV parsing 
- hashing large files
- Blocking SDKs
- requests
- filesystem heavy work

---

## Why your API becomes slow under load

This is usually what happens Imagine 30 users upload PDFs 

If parsing happens inside the event loop:

- request 1 blocks
- request 2 waits
- request 3 waits
- latency explodes

Even though the route says `async`

That is one of the most common performance problems

---

### NesJS equivalent 

In NestJS 

```ts
@Post()
async upload() {
    const pdf = heavyPdfParse()
    return pdf
}
```

If `heavyPdfParse()` is CPU-heavy synchronous JS:

- Node event loop blocks
- entire process becomes slow

Same Problem

Node and Python are very similar here.
The difference is mostly ecosystem exceptions

---

Good mental shortcut

When writing FastAPI, always ask:
    "Will this line wait on external I/O, or consume CPU?

If external async I/O:
    - use await
If blocking CPU or sync library 
    - threadpool or background job


| Work                   | What to do          |
| ---------------------- | ------------------- |
| PostgreSQL async query | `await`             |
| HTTP API call          | `await`             |
| Redis async client     | `await`             |
| PDF parsing            | threadpool          |
| image resize           | threadpool          |
| virus scanning         | threadpool / worker |
| long AI pipeline       | background queue    |


One important thing most people miss

`async` improves concurrency, not speed of computation
If something takes 4 seconds of CPU work, async does not make it 1 second
It only prevents that task from blocking unrelated requests
That distinction matters a lot

---

The one sentence version

`async def` this function can pause "it does not mean" everything inside it is non-blocking

That sentence usually makes the whole model click

---

```py
from starlette.concurrency import run_in_threadpool

def parse_pdf(file_bytes: bytes):
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        ...

@app.post("/upload")
async def upload(file: UploadFile):
    file_bytes = await file.read()
    result = await run_in_threadpool(parse_pdf, file_bytes)
    return result
    
```

Think of it like this

Imagine this:

```py
@app.post("/upload")
async def upload():
    text = await run_in_threadpool(parse_pdf)
    structured = await llm_extract(text)
    return structured
```

Suppose parsing takes 4 seconds

During those 4 seconds 

During those 4 seconds

- this request is paused 
- structured has not started
- another user can call /health
- another user can call /login

Then after 4 seconds 

- parsing finishes 
- this request resumes 
- structured = starts

--- 

What if parsing fails

Then the exception appears at the await line

Example

```py
try:
    text = await run_in_threadpool(parse_pdf,file_bytes)
exception Exception as e:
    raise UnprocessableFileException(f"PDF parse failed: {e}")
```

---

Trade-off :) 

A threadpool is not infinite 

If 

- 500 users uploads PDFs 
- each parse takes 4 seconds
- threadpool has 10 workers

Then:

- 10 jobs run now
- 490 waits in queue

So threadpool protects responsiveness, but it does not magic create unlimited CPU.

That's where later you start thinking about Celery, background workers, or job queues