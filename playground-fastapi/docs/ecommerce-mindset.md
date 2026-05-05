
# 10K users on an e-commerce app e.g. Noon, Walmart

Threadpool solves blocking code inside one process

Black Friday is a system design / traffic shaping / data integrity problem

### First Principle

Not every request should be treated at the same. Think of traffic in three buckets

**1, Critical synchronous requests**

These must finish before the user can continue

Examples

- Login
- Add to cart
- Create order
- Payment authorization
- Inventory reservation

These usually stay inside the request-response path

---

**2, Important but not user-blocking**

These can happen shortly after:

Examples

- send confirmation email
- analytics
- generate invoice PDF 
- notify warehouse
- webhook fanout

These should move to background jobs

---

**3, Heavy/offline work**

These definitely should not run inside the API request

Example

- PDF parsing
- report generation
- bulk imports
- search reindexing
- recommendation recalculation

These belong in workers

---

## What happens at 10k users

The real danger is not CPU first

It is usually:

- too many DB writes
- row locking 
- inventory race conditions
- payment retries 
- slow downstream providers
- connection pool exhaustion

That is where systems usually fail

---

## Example checkout under load

Suppose 2000 users try to buy the same product 

A dangerous implementation. "which I'm doing it :)" 

```py
product await db.get(Product,product_id)

if product.stock > 0:
    product.stock -= 1
    await db.commit()
```

Two requests can read stock = 1 at the same time

That causes overselling

---

```py
product = await db.execute(
    select(Product)
    .where(Product.id == product_id)
    .with_for_update() 
)
```

Now only one request can modify that inventory row at once

That matters more than threadpool

---

**Inngest/Celery + Redis? Background jobs**

Good for checkout itself

- order created -> send email
- order created -> notify warehouse
- order created -> generate invoice 
- order shipped -> notify customer 
- payment failed -> retry later

That is a very good fit

---

**Not ideal for** 

These should remain synchronous:

- charge card
- reserve stock 
- create order record
- validate inventory

Because the user needs immediate result.

---

## E-commerce architecture

API request User clicks Buy now

The API should do only this

Step 1: validate request

- user 
- cart
- price 
- stock 

Step 2: transaction

- reserve stock 
- create order 
- payment authorization 
- commit

Step 3: return success immediately 

```py
"order_id": 123,
"status": "confirmed"
```

That should be fast

---

**After success**

Emit background events

Example:

```py
await inngest.send(
    name="order/created",
    data={"order_id": order.id}
)
```

Workers then do:

- email
- invoice
- CRM
- analytics
- warehouse

That keeps checkout fast

---

## What scales better than threadpool

1. Horizontal scaling
    - Instead of one big server 
        - 1 instances -> 10 instances
    - Run multiple fastapi workers behind a load balancer
    That's usually the first big win

2. Background queues
    - Heavy work leaves request path
    That's where Celery, Redis, or Inngest help

3. Caching
    - Example
        - Product Pages
        - Categories
        - features flags
    Not every request should hit the DB

4. Connection pool tuning 

A very common production bottleneck 

Sometimes the API is fine - but DB only allows 20-50 concurrent active connections


---

## Real Black Friday mindset

Think: "What absolutely must happen before response"

Everything else becomes async 

That single design choice makes systems survive spikes

**Sync** auth, cart, checkout, stock reservation, payment
**Background** emails, audit logs, analytics, invoices, recommendation updates, admin notifications


Simple Rule

For high traffic:
    - short request path + strong DB transaction + async side effects