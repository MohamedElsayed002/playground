
# Concurrency 

Handling multiple tasks at the same time without waiting for each one to finish

Not the same as parallelism 

Example

- User A uploads PDF
- User B uploads PDF
- User C logs in 

You server shouldn't process them one by one
It should interleave them efficiently

---

## The Event Loop (the heart of FastAPI)

FastAPI runs on asyncio, which uses an event loop

Think of it like this

You are a chef 

- You put pasta in boiling water
- While waiting -> you chop vegetables 
- While waiting -> you cook sauce

I don't just stop waiting

That exactly what the event loop does

---

## Flow 

1. Receive request
2. Start task
3. If task is waiting (I/O):
    - parse it
    - switch to another task
4. Comeback when ready


---

## Blocking vs Non-blocking 

This is where most bugs and performance come from

**Blocking code**

```py
import time 

def bad_function():
    time.sleep(5)
```

What happens?
- Entire server waits 5 seconds
- No other request handled


**Non-blocking code**

```py
import asyncio 

async def good_function():
    await asyncio.sleep(5)
```

What happens?

- Tasks pauses 
- Event loop handles other requests

---

## Real FastAPI Example 

Bad (blocking)

```py
with open(temp_path,"rb) as f:
    file_bytes = f.read()
```

This is blocking I/O

Better

```py
import aiofiles

async with aiofiles.open(temp_path,'rb') as f:
    file_bytes = await f.read()
```

---

## Important Truth 
Even if your function is `async`, you can still block the server

Example

```py
async def route():
    time.sleep(5) # Still blocking
```


### I/O bound (good for async)

- DB queries 
- HTTP request
- File reading 
- APIs

Use `async/await`

### CPU-bound (bad for async)

- PDF parsing 
- AI processing
- heavy calculations

Async won't help much

---

```py
with pdfplumber.open(...) as pdf:
```

This is CPU heavy

---

Problem 

If 10 users upload PDFs:

- CPU gets blocked
- Requests slow down

---

Solution 

Move CPU work to background

```py
from fastapi.concurrency import run_in_threadpool

result = await run_in_threadpool(parse_pdf, file_bytes)
```

## How FastAPI handles Requests

When request comes:

1- If route is `async` -> handled by event loop
2- If route is `def` -> sent to threadpool


### Subtle Bug

```py
@route.get('/')
def sync_route():
    time.sleep(5)
```

Runs in threadpool -> OK-ish

But:

```py
@router.get('/')
async def async_route():
    time.sleep(5)
```

Blocks event loop -> Bad

---

## Threadpool vs Async 

FastAPI uses both:

| Type         | Use case       |
| ------------ | -------------- |
| async/await  | I/O operations |
| threadpool   | blocking work  |
| process pool | heavy CPU      |


---

## Best Practices

Uses async for

- DB (Async session)
- HTTP calls
- file uploads

Offload 

- PDF parsing 
- AI processing

Avoid 

- `time.sleep`
- large loops in async routes
- blocking libraries inside async

--- 

## Mental Model 
When writing code, always ask:

If yes:

- use `await` 
- Will use CPU heavily

If yes 
- move to thread / background job

---

**Better architecture**

- API
    - save file
    - return job_id immediately
- Background worker
    - parse PDF
    - extract data
    - update DB
This avoids blocking your API

--- 

Most devs
- Write async code
- But still block event loop

Senior devs:
- Understand what blocks and why


| Concept      | Meaning             |
| ------------ | ------------------- |
| Event loop   | manages async tasks |
| Blocking     | stops everything    |
| Non-blocking | allows concurrency  |
| I/O-bound    | async works well    |
| CPU-bound    | use threads/jobs    |
