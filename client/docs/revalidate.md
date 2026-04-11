# Revalidating 

Revalidation is the process of updating cached data. It lets you keep serving fast cached,
responses while ensuring content stays fresh. There are two strategies

- **Time based revalidation** Automatically refresh cached data after a set duration using `cacheLife`
- **On demand revalidation** Manually invalidate cached data after a mutation using `revalidateTag`, 
`updateTag`, or `revalidatePath`

### `cacheLife` 

`cacheLife` controls how long cached data remains valid. Use it inside a `use cache` scope 
to set the cache lifetime

```tsx
import { cacheLife } from 'next/cache'
 
export async function getProducts() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM products')
}
```

Profile	stale	revalidate	expire
seconds	0	1s	60s
minutes	5m	1m	1h
hours	5m	1h	1d
days	5m	1d	1w
weeks	5m	1w	30d
max	5m	30d	~indefinite

For fine-grained control, pass on object
```tsx
'use cache'
cacheLife({
  stale: 3600, // 1 hour until considered stale
  revalidate: 7200, // 2 hours until revalidated
  expire: 86400, // 1 day until expired
})
```

https://nextjs.org/docs/app/getting-started/revalidating