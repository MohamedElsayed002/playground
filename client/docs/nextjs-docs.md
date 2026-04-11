# Nextjs 

## Rendering with Search Params 

In a server Component a page, you can access search parameters using `searchParams` prop:

```tsx
export default async function Page({
    searchParams
} : {
    searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
    const filers = (await searchParams).filters
}
```

### What to use and when

- Use the `searchParams` prop when you need to search parameters to load data for the page
(e.g. pagination, filtering from a database)
- Use `useSearchParams` when search parameters are used only on the client (e.g. filtering 
a list already load via props)
- As a small optimization, you can use `new URLSearchParams(window.location.search)` 
in callbacks or event handlers to read search params without triggering re-renders

---

## Slow Networks 

On slow or unstable networks, prefetching may not finish before the user clicks a link. 
this can affect both static and dynamic routes. In these cases, `loading` fallback may not 
appear immediately because it hasn't been protected yet.

To improve perceived performance, you can use the `useLinkStatus hook` to show immediate 
feedback while the transition is in progress 

```tsx
'use client'
 
import { useLinkStatus } from 'next/link'
 
export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return (
    <span aria-hidden className={`link-hint ${pending ? 'is-pending' : ''}`} />
  )
}
```

Better UI

Progress bar https://github.com/vercel/react-transition-progress

---

## Disabling prefetchnig 

You can opt out of prefetching by setting the `prefetch` prop to `false` on the `Link` component. This is useful to avoid unnecssary usage of resources when rendering large lists of links (e.g. an infinite scroll table)

```tsx
<Link prefetch={false} href="/blog">
  Blog
</Link>
```

However, disabling prefetching comes with trade-offs

- **Static routes** will only be fetched when the user clicks the link
- **Dynamic Routes** will need to be rendered on the server first before the client can navigate to it

To reduce resources usuage without fully disabling prefetch, you can prefetch only on hover. This
limits prefetching to routes to user is more likely to visit, rather than all links in the viewport 

```tsx
'use client'
 
import Link from 'next/link'
import { useState } from 'react'
 
function HoverPrefetchLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)
 
  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  )
}
```

---


## Hydration not completed 

`Link` is a client Component and must by hydarted before it can prefetch routes. On the inital visit, large
Javascript bundles can delay hydration, preventing prefetching from starting right away 

React mitigates this with Selective Hydation and you can further improve this by:

- Using `@next/bundle-analyzer` plugin to identify and reduce bundle size by removing large deps
- Moving logic from client to the server where possible

## `@next/bundle-analyzer` for Webpack

The `@next/bundle-analyzer` is a plugin that helps you manage the size of your applicaiton
bundles. It generates a visual report of the size of each pacakge and their depenedencies. You
can use the information to remove large dep, split, or lazy load your code

### Step 1: Installation

Install the plugin by running the following command 

```npm install @next/bundle-analyzer```

```next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {}
 
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
 
module.exports = withBundleAnalyzer(nextConfig)
```

### Step 2 Generating a report 

Run the following command to analyze your bundles 

```txt
ANALYZE=true npm run build
# or
ANALYZE=true yarn build
# or
ANALYZE=true pnpm build
```

https://nextjs.org/docs/app/guides/package-bundling#nextbundle-analyzer-for-webpack