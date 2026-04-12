## Why we use @tanstack/react-virtual

In this project, we render a potentially large list of users
(each with name, image, bio, etc.). Rendering all users at once
would create a large number of DOM nodes, which leads to:

- Slow initial render
- Laggy scrolling
- High memory usage
- Poor performance on lower-end devices
  To solve this, we use @tanstack/react-virtual.
  What problem it solves

---

Instead of rendering the entire list, virtualization renders only
the items that are currently visible in the viewport (plus a small buffer).
This means:

- The DOM stays small (even with thousands of users)
- Scrolling remains smooth
- Performance is consistent regardless of list size
  Internally, the library:
- Calculates which items are visible
- Positions them using absolute positioning
- Simulates the full height of the list
  Why @tanstack/react-virtual specifically

---

We chose @tanstack/react-virtual because:

- It is headless → full control over UI and styling
- Works well with modern React and Next.js
- Supports dynamic and variable item sizes
- Easy to extend (infinite scroll, grids, tables)
- Actively maintained (part of TanStack ecosystem)
  Comparison with alternatives

---

react-window:

- Simpler API
- Good for basic fixed-size lists
- Limited flexibility (harder for dynamic layouts)
  @tanstack/react-virtual:
- More flexible and powerful
- Handles complex layouts (dynamic heights, grids)
- Better suited for real-world applications
  When to use virtualization

---

Use it when:

- Rendering large lists (100+ items, especially 1000+)
- Building feeds, dashboards, or tables
- Performance and smooth scrolling are important
  Avoid it when:
- The list is small (adds unnecessary complexity)
  In this project

---

We use virtualization to efficiently render user data
while maintaining smooth performance and scalability.
