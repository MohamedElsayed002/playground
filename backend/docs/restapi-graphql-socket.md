## Rest API

A REST API is a standard way of structuring backend endpoints using HTTP methods 

### How it works

- Multiple endpoints
    - `/users`
    - `/posts`
    - `/comments`
- Uses HTTP methods
    - GET, POST, PUT, DELETE

---

### Pros

- Simple and widely understood
- Works well with caching (HTTP caching, CDNs)
- Easy to debug (just hit URLs)
- Strong ecosystem & tooling

### Cons

- Over-fetching (you get more data than needed)
- Under-fetching (need multiple requests for related data)
- Versioning can get messy

### Best Use Cases

- CRUD apps (dashboards, admin panels)
- Public APIS
- Systems where simplicity and stability matter

---

## GraphQL

GraphQL is a query language for APIs where the client specifies exactly what data it needs

### How it works

- Single endpoint (usually `/graphql` )
- Client sends queries like:

```json
{
  user(id: 1) {
    name
    posts {
      title
    }
  }
}
```

### Pros

- No over-fetching or under-fetching
- Fetch related data in one request
- Strong typing (schema-based)
- Great for complex frontends

### Cons

- More complex to setup
- Harder caching
- Can be inefficient if poorly designed
- Learning curve for teams

### Best Use Cases

- Complex UIs (mobile apps, dashboards)
- App with many related data models
- When frontend needs flexibility

---

## Socket IO (WebSockets)

[Socket.IO](http://Socket.IO) enables real-time, bidirectional communication between client and server

- Persistent connection (not request/ response)
- Server can push data anytime
- Uses events:
    - `message`
    - `typing`
    - `notificaiton`

### Pros

- Real-time updates (instant)
- Low latency after connection established
- Bi-directional (server ↔ client)
- Great for live features

### Cons

- More complex infrastructure
- Not cacheable
- Harder to scale (requires state handling)
- Not ideal for simple CRUD

### Best Use Cases

- Chat apps
- Live notifications
- Multiplayer games
- Real-time dashboards (stocks, analytics)

---

## Key Differences (Quick Table)

| Feature | REST API | GraphQL | Socket.IO |
| --- | --- | --- | --- |
| Communication | Request/Response | Request/Response | Real-time (persistent) |
| Endpoints | Many | Single | Event-based |
| Data fetching | Fixed | Flexible | Push-based |
| Real-time | ❌ | ❌ (by default) | ✅ |
| Complexity | Low | Medium–High | Medium–High |