# Checkout concurrency and overselling

## The problem

The checkout loaded the cart with `selectinload(CartItem.product)`. That loads `Product` objects into the current SQLAlchemy session before `_execute_checkout_2()` runs.

The later query used `SELECT ... FOR UPDATE`, but a row lock does not automatically mean that SQLAlchemy replaces an object already present in its identity map. The code could therefore validate stock using an older in-memory value instead of the value read while acquiring the lock.

There is a second independent detail: the checkout route creates a new UUID when the client does not send an `Idempotency-Key`. Two browsers therefore create two different operations. Idempotency prevents retries of the same operation; it does not merge two separate checkout attempts.

## The fix

The product lock query now uses:

```python
.with_for_update().execution_options(populate_existing=True)
```

`populate_existing=True` forces the locked query to refresh the existing `Product` object from PostgreSQL. Stock validation then uses the value read under the row lock.

The stock decrement also uses a database-level conditional update:

```sql
UPDATE products
SET stock_quantity = stock_quantity - :quantity
WHERE id = :product_id
  AND stock_quantity >= :quantity
```

If the update affects no row, the checkout raises `OutOfStockError` and the transaction rolls back. This is the final invariant: PostgreSQL will not reserve more stock than exists, even if another code path later introduces a stale ORM object.

## What happens with two browsers

For a product with stock `6`, where each cart requests quantity `5`:

1. Checkout A locks the product row and reserves `5`.
2. Checkout B waits for that lock.
3. Checkout A commits, leaving stock `1`.
4. Checkout B reads `1` and fails validation, or its conditional update affects zero rows.
5. Checkout B rolls back; it must not create a successful order.

For two products, stock is checked per product. A combined total is not interchangeable: product 1 stock cannot satisfy a request for product 2.

## How to verify it

1. Set one product's stock to `6`.
2. Put quantity `5` of that product in the user's cart.
3. Send two checkout requests concurrently using different idempotency keys, or omit the header as the current client does.
4. Expect exactly one successful checkout and one `OutOfStockError` response.
5. Confirm the product stock is `1`, not negative and not enough for a second successful order.
6. Inspect the audit logs and order items to confirm only one order reserved the stock.

The application must point both requests at the same PostgreSQL/Neon database. Testing different deployments or database URLs does not test the same inventory row.
