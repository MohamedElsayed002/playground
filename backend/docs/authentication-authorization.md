## 1) Authentication vs Authorization

These are often confused, but they are fundamentally different

Authentication 

Who are you?

- Verifies identify
- Examples
    - Logging in with username + password
    - Logging in with OAuth 2.0 + JWT
    - Biometrics (fingerprint, FaceID)

Authorization

What are you allowed to do?

- Determines access level
- Examples
    - `role = admin`  → can delete users
    - `role = user`  → can only view content
    - OAuth scopes: `email` , `profile` , `contacts`

---

Simple analogy 

- Authentication = showing your ID card
- Authorization = checking if your ID allows you in the restricted room

---

## 2) Sessions

- What is a session?
    - A session is a server-side concept that tracks a user’s state
    
    ---
    

How it works:

1. User logs with credentials
2. Server creates a session record

```json
session_id: abc123
user_id: 123
expires: 1h
```

1. Server sends session ID to the client (usually as a cookie)
2. On each request, client sends the session ID
3. Server looks up the session → authenticates user

---

Pros of server-side sessions

- Easy to revoke access anytime (delete session)
- Works with secure cookies
- Safe from client tampering

Cons:

- Needs server memory or database storage
- Harder to scale across multiple servers without replication

---

## 3) LocalStorage

What is localStorage?

- Client-Side storage in the browser
- Stores key-value data, persistent even after page relaod

```json
localStorage.setItem('token', 'JWT_TOKEN_HERE');
```

- Often used to store JWT Tokens

---

Pros

- Simple
- Works well for Single Page App
- Survives page refresh

Cons

- Vulnerable to XSS attacks
- Cannot be automatically send with requests like cookies
- Harder to revoke access

---

| Feature | Cookies | LocalStorage | Sessions (Server-Side) |
| --- | --- | --- | --- |
| Stored | Browser | Browser | Server |
| Auto sent with requests | ✅ | ❌ | ✅ (via cookie) |
| Persistent | Can expire | Persistent | Server-dependent |
| XSS Risk | Medium (if HttpOnly) | High | Low (server-side) |
| CSRF Risk | High (if no CSRF tokens) | Low | Depends |
- Secure Storage for JWT
- Best practice: store in HTTP-only cookies
    - Not accessible by JS → Protects against XSS
    - can use samesite to protect CSRF

---
