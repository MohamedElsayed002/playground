

# Refund Business Logic v1 

The diagram below is my thoughts how to design the refund logic. I discussed it with ChatGPT. and I asked ChatGPT to give me diagram for the steps for the version 1. I might change step or add new one in new versions.

I asked also ChatGPT to give me questions to answer. to act like a senior developer. trying to solve real problem. 

```
                 ┌─────────────────────┐
                 │  POST /refund       │
                 │  User requests      │
                 │  refund             │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ 1. Authenticate     │
                 │    user             │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │ 2. Idempotency      │
                 │    key validation   │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │ 3. Find Order       │
                 │    + Order Item     │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │ 4. Verify ownership │
                 │    & item purchased │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │ 5. Refund Policy    │
                 │  • < 30 days?       │
                 │  • refundable?      │
                 │  • already refunded?│
                 │  • calculate 80%    │
                 └──────────┬──────────┘
                            ▼
        ┌──────────────────────────────────────┐
        │ 6. DATABASE TRANSACTION              │
        │                                      │
        │  Create Refund = PROCESSING          │
        │  Create Outbox Event                 │
        │                                      │
        │  COMMIT BOTH ATOMICALLY               │
        └──────────────────┬───────────────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │ 7. Return 202       │
                 │    PROCESSING       │
                 └─────────────────────┘


              BACKGROUND WORKER
                     │
                     ▼
          ┌──────────────────────┐
          │ 8. Read Outbox       │
          │    → Stripe Refund   │
          │    → Stripe idempot. │
          └──────────┬───────────┘
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
          Success           Failure
             │                │
             ▼                ▼
      Stripe Webhook     Retry / failed
             │
             ▼
   ┌─────────────────────────┐
   │ 9. Verify Stripe webhook │
   │    Update Refund status  │
   │    → REFUNDED / FAILED  │
   └─────────────────────────┘


          RECONCILIATION JOB
                 │
                 ▼
     "Which refunds are stuck
       in PROCESSING?"
                 │
                 ▼
        Check Stripe status
                 │
                 ▼
          Repair DB state
```

---

## Idempotency 

- What happens if the user sends the exact same request 5 times? 

Q: since the user sending with the request idempodency-key. I can get the first request. apply row locking no other request can access it "specific row" till it is released. Also I can add rate limiter in this route to avoid multi request. give the user in the frontend loading status and the button is disabled he not allowed to press it. and if clicked one more time we can show him status. `status: processing`

Correction

```
Request #1  -> Idempodency key = abc123 -> Create Idempotency record -> process refund -> 
**`status = Processing`**
```

Then request #2-#5 use abc123. they will not create new refund. will get the resut status.

But I would never not rely on row locking as the primary idempotency mechanism. Why?

Because locking only protects you while the transaction is holding the lock. the real guarantee should come from a database uniqueness constraint

```
UNIQUE(user_id, request_path, idempotency_key)
```

Then two requests arriving simultaneously cannot both create the idempotency record

Also **Frontend button disabling is UX, not a correct mechanism**

A malicious client, browser retry, network retry, mobile app retry, etc. can completely bypass it.

Rate limiting is useful too, but rate limiting != idempotency 

```
Idempotency → prevents duplicate operation
Rate limiting → controls excessive traffic
Locking → controls concurrent access
Frontend loading → improves UX
```

- Where do I store the idempotency key?

Q: in table idempotency keys with request_path `order/refund` and we can search by both of them also we can add the user id. so if the user doing purchase and refund for another item at the same it we dont want to block him. just send to idempotency key what route he is consuming `order/purchase` 

- What happens if two requests arrive at exactly the same time?

Q: We can start  the transaction and do row locking. add one more guard but the first request if failed need to rollback to let the user do the request in another time. 

**Correction**

```
Request A                  Request B
   │                          │
   ├── BEGIN                  ├── BEGIN
   │                          │
   ├── check idempotency      ├── check idempotency
   │                          │
   └──────────── ??? ─────────┘
```

```
INSERT INTO idempotency_keys (...)
VALUES (...)
ON CONFLICT (...) ...
```

Only one request successfully claims the key 

Then 

```
Request A → owns key → processes refund
Request B → key already exists → returns existing status
```

- What database constraint prevents duplicate refunds

Q: By order_id 

## Refund Business Rules

- What exactly makes an order refundable?

not the same like the images/ broken item. so i will open dialog show the user instructions. of the refund but i will accept it because my project not a production yet. 

- Is the 30-day period calculated from order creation, payment, or delivery?

from creation because I don't have from delivery. created_at + 30 days 

- Is the 20% fee always applied?

:D 
- What happens if only one item from a 5-item order is refunded?

Error all or nothing. if the user have 5 items in the cart and wants to refund the order so he will refund all the products. 

but i can add this logic in the future if the user wants to keep something 


## Money

- How do I calculate the refund amount safely?

Stripe is source of truth not my database so we will send payment intent id to stripe to check how much the user paid 

- Do I use floating-point numbers or integer cents?

integer cents
float 0.1 + 0.2 = 0.30004

- Where do I store the original amount and refunded amount?

in my database `total_amount` and if it is refuned will have flag `status: refunded` so means he get the full value back 

- How do I prevent refunding more than the customer originally paid?

customer has no authority to write how much to get back. the source of code is my application or stripe. i will show for the user refund button if clicked okay will do the refund process in the background. 

## Database transaction

- Which records must be created atomically?
- What happens if the server crashes after creating the refund but before creating the outbox event? 
- What happens if Stripe is called inside the database transaction?

## Outbox

- What exactly goes into my `refund_request` outbox event?
- What happens if the worker crashes halfway through processing?
- How do I retry safely? 
- What status should the outbox event have?

## Stripe

- What Stripe identifier do I actually need?
- What idempotency key do I send to Stripe?
- What happens if Stripe successfully refunds the money but my API times out? 
- How do I know whether Stripe actually completed the refund?

## Webhook

- How do I verify the webhook really came from Stripe?
- What if Stripe sends the same webhook twice?
- What if the webhook arrives before my worker receives the response?
- What if the webhook says success but my refund is already marked `REFUNDED`

## Concurrency

- What happens if two refund requests for the same item arrive simultaneously?
- Do I need a row lock?
- Is a database `UNIQUE` constraint enough?
- Can inventory be restored twice?

## Reconciliation

- How do I find refunds stuck in PROCESSING?
- How long should something remain processing before I investigate it?
- How can the reconciliation job safely repair the state?
- What happens if Stripe says REFUNDED but my database says PROCESSING?