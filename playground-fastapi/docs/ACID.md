
# ACID 

A = Atomicity 
C = Consistency
I = Isolation 
D = Durability

One Important note first: DDIA's Chapter 7 "Transaction" is dense because it is really about one giant question

"How can a database keep data correct when many things are happening concurrently, transactions fail halfway through, processes crash, and different operations interact with each other?"

---

## 1. Start with the big picture 

Imagine your database has:

```
Product #1
stock = 6
```

Two requests arrive at nearly the same time:

```
Browser A                 Browser B
    │                         │
    │ checkout 5              │ checkout 3
    ▼                         ▼
Transaction A            Transaction B
    │                         │
    └──────────┬──────────────┘
               ▼
          PostgreSQL
```


Now PostgreSQL has to answer 

    What happens when A and B want to read/write the same data at the same time?

That's the central problem behind much of Chapter 7

---

## 2. First What is a transaction?

A **transaction** is a group of database operations that should be treated as one logical unit of work

For example, checkout might be

```
BEGIN

1. Check product 1
2. Reduce product 1 stock
3. Check product 2
4. Reduce product 2 stock
5. Create order
6. Create order items
7. Clear cart

COMMIT
```

The database should not leave you with:

```
stock changed
order wasn't created
cart wasn't cleared
```

If those operations are supposed to represent one business operation

A transaction gives you a boundary 

```
┌───────────────────────────────┐
│          TRANSACTION           │
│                               │
│  update A                     │
│  update B                     │
│  insert C                     │
│                               │
└───────────────┬───────────────┘
                │
              COMMIT
```              

---

## ACID 

But don't memorize / Atomicity = all or nothing 

That's only the beginning 

Let's go through each one using my checkout route

---

## A - Atomicity

Atomicity means: The transaction happens completely or not at all

Suppose checkout requires 

```
Product 1: decrease stock by 5
Product 2: decrease stock by 3
Create order
Create order items
Clear cart
```

**But here's an important distinction**

Atomicity does not mean:

    "Nothing else can access these rows while I'm working"

That **isolation/concurrency** control

This distinction matters enormously

---

## C - Consistency 

This one is often misunderstood

Database consistency means 

    "A transaction takes the database from one valid state to another valid state, according to the application's/database's rules

For example 

```
stock >= 0
```

could be an invariant

Before 

```
stock = 6
```

After a valid checkout:

```
stock = `
```

Still Valid

But 

```
stock = -2
```

Violates the invariant

You can enforce some consistency at the database level

```sql
CHECK (stock >= 0)
```

I can also enforce things like

```
PRIMARY KEY
FOREIGN KEY
UNIQUE 
NOT NULL 
CHECK
```

---

## 6. Very Important: Consistency is NOT the same as Isolation

This causes enormous confusion 

Suppose you have:

```
stock = 6
```

Two transactions both read it 

```
A -> reads 6
B -> reads 6
```

That's an isolation/concurrency problem

But if your database ends up with

```
stock = -2
```

That's a consistency/invariant problem.

They are related, but different 

Think:

```
Consistency
    ↓
"Is my data valid?"

Isolation
    ↓
"How do concurrent transactions interact?"
```

---

## 7. Isolation 

This is probably the most important ACID property for your current checkout problem 

Isolation asks `What should one transactions be allowed to see while another transaction is running?`

Imagine 

```
stock = 6 
```

Transaction A:

```
READ stock -> 6
```

Transaction B:

```
READ stock -> 6
```

Both see the same value 

Then:

A -> Buy 5
b -> Buy 3

Now you have a concurrency problem
Isolation mechanisms determine what happens when transactions overlap

---

## 8. Simplest mental model of isolation 

Imagine transactions are people editing the same document 

Without proper concurrency control

```
A reads document
B reads document

A changes it
B changes it

B accidentally overwrites A
```

Database isolation mechanisms prevent different classes of these problems DDIA discusses several

---

## 9. Read committed 

PostgreSQL's default isolation level is generally **Read Committed**

The basic ideas is 

    A transaction doesn't see another transaction's uncommitted changes

Imagine 

```
Transaction A:

UPDATE stock = 1

but hasn't committed yet.
```

Transactions B doesn't simple see:

```
stock = 1
```

as though it were already committed

That's useful because otherwise B could read data that later disappears due to a rollback 

---

## 10. Dirty reads 

Suppose 

```
A:
UPDATE stock = 1
```

but A hasn't committed 

B reads:

```
stock = 1
```

Then A crashes:

```
ROLLBACK
```

Actual stock returns to:

```
6
```

But B had already seen:

```
1
```

B saw something that was never actually committed 

That's a 

### Dirty read 

Conceptually 

```
A                         B

UPDATE stock = 1
       │
       │ uncommitted
       ├───────────────→ READ stock
       │                     │
       │                     ▼
       │                    1
       │
ROLLBACK
       │
       ▼
stock = 6
```

That's exactly the kind of thing isolation levels control

---

## Write Skew 

This is a more subtle concurrency problem.

Imagine two doctors.

```
Doctor A
Doctor B
```

The rule is 
    At least one doctor must remain on call

Initially 

```
Alice = ON
Bob = ON
```

Transaction A checks 

```
Bob is ON
```

So Alice Says

```
I can go OFF
```

Transaction B checks 

```
Alice is ON
```

So Bob says 

```
I can go OFF
```

Both transactions commit 

Now Both of them are OFF

The database has violated the business rule
Neither transaction necessarily overwrote the same row
that's why just locking individual rows isn't always enough for every business invariant
This is one reason Chapter 7 gets much deeper than simple "lock the row"

---


## D - Durability 

Durability means 

    "Once the database tells you the transaction committed, the committed data should survive a crash."

For example:

```
COMMIT
 ↓
200 OK
 ↓
💥 server crashes
```

When PostgreSQL comes back 

```
Order still exists
Product update still exists
```

Durability is usually achieved through mechanisms such as 

```
write-ahead logging
disk persistence
replication
recovery
```

## Why this is better than simply locking everything 

You don't want to immediately think:

    "Concurrency = SELECT FOR UPDATE everywhere"

Locks have costs

Imagine 1,000 people buying the same product 

With pessimistic locking 

```
Customer 1 → lock
Customer 2 → waiting
Customer 3 → waiting
Customer 4 → waiting
...
Customer 1000 → waiting
```

Sometimes that's appropriate.

But an atomic conditional update can let the database efficiently handle the operation

```sql
UPDATE ... WHERE stock >= quantity
```

For simple inventory decrementing that's often a very clean design

---

## ACID + Chapter 7 in one picture 

```
                    CHECKOUT
                       │
                       ▼
                  TRANSACTION
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Inventory      Order        Cart
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                    COMMIT
```

ACID Asks

```
Atomicity
   │
   └── Did all of it happen or none?

Consistency
   │
   └── Are database/business rules still valid?

Isolation
   │
   └── What happens when other transactions run concurrently?

Durability
   │
   └── Does committed data survive crashes?
```

Chapter 7 then goes deep into 

```
                ISOLATION
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
    Locking       MVCC      Serializable
       │           │            │
       ▼           ▼            ▼
    WAIT/FAIL   snapshots    abort/retry
```

---

## What I want you to remember from Chapter 7

Don't try to memorize every term immediately

Build this hierarchy in your head 

```
DATABASE TRANSACTIONS
        │
        ▼
       ACID
        │
        ├── Atomicity
        │
        ├── Consistency
        │
        ├── Isolation
        │      │
        │      ├── Dirty reads
        │      ├── Lost updates
        │      ├── Non-repeatable reads
        │      ├── Phantom reads
        │      ├── Write skew
        │      │
        │      ├── Locking
        │      ├── MVCC
        │      ├── Snapshot isolation
        │      └── Serializable
        │
        └── Durability
```


---

## Here's the practical rule I'd take from the Chapter 

When you write a piece of backend code that changes important data, ask yourself:

### 1. What must change atomically 

For checkout:

```
inventory
order
order_items
cart
```

### 2. What invariants must always hold? 

For example

```
stock >= 0
order belongs to user
order_items reference real products
```

### 3. What happens if two requests happen simultaneously?

This the question your original checkout bug exposed 

### 4. What if someone reads while someone else writes?

Think 

```
isolation
MVCC
locks
```

### 5. What happens f two people modify the same thing?

Think:

```
lost update
row locking 
optimistic concurrency
atomic update
```

### 6. What happens if the transaction crashes?

Think:

```
atomicity
rollback
```

### 7. What happens after COMMIT and the external API fails?

Think

```
Transactional
eventual consistency
retry
idempotency
```

| Situation                                      | Useful technique                          |
| ---------------------------------------------- | ----------------------------------------- |
| Simple stock decrement                         | **Atomic conditional UPDATE**             |
| Need to read → make decisions → write same row | **`SELECT FOR UPDATE`**                   |
| Want to detect stale version                   | **Optimistic concurrency/version column** |
| Complex cross-row invariants                   | **Serializable transactions**             |
| Need all DB changes to succeed/fail together   | **Transaction + Atomicity**               |
| External API after DB commit                   | **Transactional Outbox**                  |
| External operation may run twice               | **Idempotency**                           |
