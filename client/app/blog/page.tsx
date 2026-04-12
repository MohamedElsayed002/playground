import { Suspense } from "react";
import { cookies } from "next/headers";
// import { cacheLife, cacheTag, updateTag } from 'next/cache'
import Link from "next/link";

export default function BlogPage() {
  return (
    <>
      <header>
        <h1>Our Blog</h1>
        <nav>
          <Link href="/">Home</Link>|<Link href="/about">About</Link>
        </nav>
      </header>

      {/* Cached dynamic content - included in the static shell */}
      <BlogPosts />

      {/* Runtime dynamic content - streams at request time */}
      <Suspense fallback={<p>Loading</p>}>
        <UserPreferences />
      </Suspense>

      {/* Mutation - server action that revalidates the cache */}
      <Suspense fallback={<p>Loading..</p>}>
        <CreatePost />
      </Suspense>
    </>
  );
}

// Everyone sees the same blog posts (revalidated every hour)
async function BlogPosts() {
  // 'use cache'
  // cacheLife('hours')
  // cacheTag('posts')

  const res = await fetch("https://api.vercel.app/blog");
  const posts = await res.json();

  return (
    <section>
      <h2>Latest Posts</h2>
      <ul>
        {posts
          .slice(0, 5)
          .map((post: { id: number; title: string; author: string; date: string }) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>
                By {post.author} on {post.date}
              </p>
            </li>
          ))}
      </ul>
    </section>
  );
}

// Personalized per user based on their cookie
async function UserPreferences() {
  const theme = (await cookies()).get("theme")?.value || "light";
  const favoriteCategory = (await cookies()).get("category")?.value;

  return (
    <aside>
      <p>Your theme: {theme}</p>
      {favoriteCategory && <p>Favorite category: {favoriteCategory}</p>}
    </aside>
  );
}

// Admin-only form that creates a post and revalidates the cache
async function CreatePost() {
  const isAdmin = (await cookies()).get("role")?.value === "admin";
  if (!isAdmin) return null;

  async function createPost() {
    "use server";
    // await db.post.create({ data: { title: formData.get('title') } })
    // updateTag('posts')
  }
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <button type="submit">Publish</button>
    </form>
  );
}
