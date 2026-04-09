# NoSQL & SQL

| Aspect      | SQL (Relational)        | NoSQL (Document)    |
| ----------- | ----------------------- | ------------------- |
| Structure   | Tables (rows + columns) | JSON-like documents |
| Schema      | Strict (fixed)          | Flexible (dynamic)  |
| Relations   | Strong (JOINs)          | Weak / embedded     |
| Scaling     | Vertical                | Horizontal          |
| Consistency | Strong (ACID)           | Eventual (often)    |



## 1. Data Modeling

In PostgreSQL (SQL) You design normalized tables:

```
Users
- id
- name

Posts
- id
- user_id
- title
```

```sql
SELECT * FROM posts 
JOIN users ON users.id = post.user_id
```

---

## In MongoDB (NoSQL)
You store nested documents

```json
{
  "name": "Mohamed",
  "posts": [
    { "title": "Post 1" },
    { "title": "Post 2" }
  ]
}
```

No JOIN needed - everything is inside one document

---

## 2. Schema Flexibility 

### SQL (PostgreSQL)

```sql
ALTER TABLE users ADD COLUMN age INT 
```

- Schmea is enforced
- Safer for large teams
- Prevents bad data

### MongoDB 

```json
{ "name": "Ali" }
{ "name": "Sara", "age": 25 }
```

- Different documents can have different fields
- Faster iteration
- But can become messy

---

## 3. Performance Philosophy 

PostgreSQL 
- Optimized for:
    - Complex queries 
    - Transactions 
    - Data integrity 
- Great for:
    - Banking systems
    - E-commerce
    - Analytics

MongoDB 
- Optimized for:
    - Fast reads/writes
    - Large-scale distributed systems
- Great for:
    - Real-time apps
    - Content feeds
    - Logging systems

---

## 4. Relationships

PostgreSQL (Relational)

- Uses foreign keys
- Supports JOINS
- Strong consistency 

MongoDB (Two approaches)

1. Embedding 

```json
user: {
  posts: [...]
}
```

2. Referencing 

```json
post: {
  userId: "123"
}
```

But not native JOINS like SQL (aggregation instead)

---

## 5. Transactions

PostgreSQL 
- Full ACID
- Reliable multi-step operations

MongoDB 
- Supports transactions (modern versions)
- But heavier and less common in design

--- 

## 6. When to Use Fetch

Use PostgreSQL when:
- Data is structured 
- You need relationships
- You care about data integrity 

Examples
- Payments
- Orders
- User systems


Use MongoDB when:

- Data is flexible or evolving 
- You need high scalability 
- You store JSON-like data

Example 
- Chat Apps
- CMS 
- Activity feeds

---

E-commerce App

PostgreSQL
- users
- orders
- products
- order_items

Perfect because relationships matter

MongoDB

```json
{
  "user": "Mohamed",
  "orders": [
    {
      "products": [...]
    }
  ]
}
```

NoSQL relations by embedding and referencing

---

## What is Cascade Delete?

When a parent record is deleted, all related child records are automatically deleted too.

## In SQL (PostgreSQL)

In relational databases like PostgreSQL, relationships are enforced using foreign keys

- Example
    - `users`  table (parent)
    - `orders`  table (child)

```json
CREATE TABLE users (
	id SERIAL PRIMARY KEY 
)

CREATE TABLE orders (
	id PRIMARY KEY 
    user_id INT REFERENCES users(id) ON DELETE CASCADE
)
```

### What happens

```json
DELETE FROM users WHERE id = 1;
```

- Automatically deletes
    - all rows in `orders`  where `user_id = 1`
- Key Idea:
    - Cascade is built into the database engine
    - Enforced with constraints
    - Safe and consistent

---

## In NoSQL (MonogDB)

In MongoDB, there are no built-in foreign keys or cascade deletes

- Examples

```json
// users collection
{ "_id": 1, "name": "Ali" }

// orders collection
{ "_id": 101, "user_id": 1 }
```

```json
db.users.deleteOne({ _id: 1 })
```

Nothing happens to `orders` 

- Why?
    - Does not enforce relationships
    - Leaves integrity to the application logic

---

To handle cascade in MongoDB. you must do it manually

---

## Orphaned Records (Orphan Problem)

child records that reference a parent that no longer exists