# Caching

Caching is a technique for storing the result of data fetching
and other computations so that future requests for the same data
can be served faster, without doing the work again

## Enabling Cache Components

You can enable Cache Components by adding the `cacheComponents` option
to your Next config file

next.config.ts

```tsx
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

### Usage

The `use cache` directive caches the return value of async functions
and components. You can apply it at two levels

- Data-Level: Cache a function that fetches or computes data `(e.g. 
getProducts(), getUser(id))`
- UI-Level: Cache an entire component or page (e.g, `async function BlogPosts()`)

### Data-Level caching

To cache an asynchronous function that fetches data, add the `use cache` directive at the top of the function body;

```tsx
import { cacheLife } from "next/cache";

export async function getUsers() {
  "use cache";
  cacheLife("hours");
  return db.query("SELECT * FROM users");
}
```

Data-level caching is useful when the same data is used across multiple components, or when you want to cache the data independently from the UI.

### UI-Level Caching

To cache an entire component, page, or layout, add the `use cache` directive at the top of the component or page body:

```tsx
import { cacheLife } from "next/cache";

export default async function Page() {
  "use cache";
  cacheLife("hours");

  const users = await db.query("SELECT * FROM users");

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Streaming uncached data

For components that fetch data from an asynchronous source such as an API, a database, or any other async operation, and require fresh data on every request, do not use `use cache`

Instead, wrap the component in `<Suspense>` and provide a fallback UI. at request time request render the fallback first, then streams in the resolved content once the async work completes

```tsx
import { Suspense } from "react";

async function LatestPosts() {
  const data = await fetch("https://api.example.com/posts");
  const posts = await data.json();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <>
      <h1>My Blog</h1>
      <Suspense fallback={<p>Loading posts...</p>}>
        <LatestPosts />
      </Suspense>
    </>
  );
}
```

---

## Working with runtime APIS

Requests-time APIs require information that is only available when a user makes a request these include:

- `cookies` - User's cookie data
- `headers` - Request headers
- `searchParams` - URL query parameters
- `params` - Dynamic route parameters

Components that access runtime APIs should be wrapped in `<Suspense>`

```tsx
import { cookies } from "next/headers";
import { Suspense } from "react";

async function UserGreeting() {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";
  return <p>Your theme: {theme}</p>;
}

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <UserGreeting />
      </Suspense>
    </>
  );
}
```

```tsx
import { cookies } from "next/headers";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

// Component (not cached) reads runtime data
async function ProfileContent() {
  const session = (await cookies()).get("session")?.value;
  return <CachedContent sessionId={session} />;
}

// Cached component receives extracted value as a prop
async function CachedContent({ sessionId }: { sessionId: string }) {
  "use cache";
  // sessionId becomes part of the cache key
  const data = await fetchUserData(sessionId);
  return <div>{data}</div>;
}
```

---

## Putting it all together

`/blog/page.tsx`

| Scenario                | Cache? |
| ----------------------- | ------ |
| Static data             | ✅     |
| Rarely changing DB data | ✅     |
| Search / filters        | ❌     |
| POST requests           | ❌     |
| User-specific data      | ❌     |
