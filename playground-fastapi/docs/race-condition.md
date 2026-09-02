
# Chapter 7: Transactions (DDIA "Designing Data Intensive Application)


## There are several ways to solve stock problem

For particular checkout problem, I want to understand these three approaches 

- Approach A - Atomic conditional UPDATE

Usually my first choice for a simple inventory decrement

- Approach B - Row-level locking

Use

```sql
SELECT .. FOR UPDATE
```

- Approach C - Serializable transactions

Let PostgreSQL detect dangerous concurrency and abort one transaction

---

## Approach A - Atomic conditional Update 

This is beautiful because the database does the important check and updates as one operation

Instead of 

```py
stock = get_stock()

if stock >= quantity:
    decrease_stock()
```

do:

```sql
UPDATE products SET stock = stock - 5 WHERE id = 'product_1' AND stock >= 5
```

Then inspect how many rows were updates 

If 

```
rows_updated = 1
```

you succeeded 

if:

```
rows_updated = 0
```

there wasn't enough stock 


### Watch what happens with your my two browsers 

Stock 6

Browser 1:

```sql
UPDATE products SET stock = stock - 5 WHERE id = 1 AND stock >= 5
```

Database: 6>=5

True

So: stock = 1 Browser 1 succeeds

Now Browser 2 executes 

```sql
UPDATE products SET stock = stock - 3 WHERE id = 1 AND stock >= 3
```

Database sees 1>= 3 False

Therefore rows_updated = 0 Browser 2 gets: 409 Conflict
or an appropriate out-of-stock response
This is probably the first solution

                PostgreSQL
                    │
                    ▼
        ┌─────────────────────┐
        │ stock >= quantity?  │
        └──────────┬──────────┘
                   │
             ┌─────┴─────┐
             │           │
            YES          NO
             │           │
             ▼           ▼
        decrement     update 0 rows
          stock          │
             │           ▼
             ▼        OUT OF STOCK
          SUCCESS

---

## Approach B - `SELECT FOR UPDATE`


Now let's learn the other important technique
Suppose you really need to read the product first and then make several decisions 

You can lock the row 

```sql
SELECT * FROM products WHERE id = 'product_1' FOR UPDATE 
```

the `FOR UPDATE` means approximately:

    " I want to modify this row. Don't let another transaction modify it while I'm working with it"

So:

```
Transaction A
      │
      ▼
SELECT product FOR UPDATE
      │
      ▼
LOCK ROW
      │
      ├── check stock
      ├── create order
      ├── decrease stock
      │
      ▼
COMMIT
      │
      ▼
RELEASE LOCK
```

Meanwhile

```
Transaction B
      │
      ▼
SELECT product FOR UPDATE
      │
      │
      │ WAIT...
      │
      │
      ▼
Transaction A commits
      │
      ▼
B gets the latest row
```

---

```sql
SELECT ... FOR UPDATE
```

means: "I am currently working on this row, another transaction attempting the same lock waits"

With optimistic concurrency/versioning

```
version = 7
```

You can say: "Update this row only if it's still version 7"

With serializable transactions: "PostgreSQL, make this behave as if these transactions happened one after another; if you can't safely do that, abort one

These are different concurrency-control strategies

---

## Approach C: SERIALIZABLE

I can run my transaction at `SERIALIZABLE`

PostgreSQL tries to ensure the result is equivalent to some serial ordering of the transactions 

If it detects a dangerous conflict, it can abort one:

```
Transaction A → COMMIT ✅

Transaction B → SERIALIZATION FAILURE ❌
```

Then your application needs to retry or return an appropriate response 

This is powerful, but you shouldn't automatically think 
    "SERIALIZABLE solves everything, so use it everywhere"

Higher isolation can mean more conflicts/retries and different performance characteristics


**Never trust the browser as the final authority for checkout**

---

## This is where chapter 7 becomes real

You're actually dealing with two different concurrency problems

### Problems 1 - Race condition 

Two checkouts simultaneously attempt to consume inventory 

Solution examples

```
atomic UPDATE
SELECT FOR UPDATE
SERIALIZABLE
```

### Problem 2 - stale client state

Browser 2 has an old representation of the cart 

Solution 

```
server/database is authoritative
```

and potentially synchronize the UI when cart changes 

---

## The mental model for Chapter 7

```
                 CONCURRENT REQUESTS
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         Transaction A         Transaction B
              │                     │
              └──────────┬──────────┘
                         ▼
                 SAME DATABASE ROW
                         │
                CONCURRENCY CONTROL
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Atomic UPDATE   Row Lock      Serializable
          │              │              │
          ▼              ▼              ▼
       success/       wait for       commit or
        failure         lock           abort

```

```
Browser A ──────┐
                │
Browser B ──────┼──→ PostgreSQL
                │         │
Browser C ──────┘         │
                          ▼
                   inventory check
                          │
                   atomic operation
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
             enough             not enough
                │                   │
                ▼                   ▼
             COMMIT               ABORT
                │
                ▼
             ORDER
```


This is the stuff that separates "I can generate a checkout route" from I understand why this checkout route is safe under concurrency"

