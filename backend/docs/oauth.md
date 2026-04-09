## What is OAuth?

Open Authorization is A way to let an app access your data without giving it your password

Real-life example

When you click:

- Login with Google
- Continue with Facebook

That’s OAuth

---

## 2) The Problem OAuth Solves

Before OAuth:

X You give your password to every app

→ very unsafe

With OAuth:

You only trust the main provider (Google, Facebook, etc)

→ Apps never see your password

---

## 3) Keys Roles in OAuth

There are 4 main parts

1. Resource Owner: The user (you)
2. Client: The app your are using (e.g. a website using Google login)
3. Authorization Server: Handle login and permissions (e.g. Google)
4. Resource Server: Stores your data (Google APIs)

---

## 4) How OAuth Works (Step-by-Step)

Let’s say you use “Login with Google”

Step 1: You click login: App redirects you to google

Step 2: You authenticate: You log in on Google (not the app)

Step 3: You give permission: Example Allow access to email / Allow access to profile

Step 4: App gets a token (Not password) Google sends back: Access token

Step 5: App uses the token

```json
GET /userinfo
Authorization: Bearer ACCESS_TOKEN
```

---

## 5) What is an Access Token?

A temporary key to access your data 

- Short lived
- Limited permissions
- Safer than password

---

## 6) Refresh Token

Because access tokens expire:

- Refresh token is used to get a new one
    - Long-lived
    - More sensitive
    - Stored securely

---

## 7) Why OAuth is Secure

1. No password sharing (App never sees your password)
2. Limited access (Only allowed scopes)
3. Token expiration (Reduces risk)
4. Revocable (You can remove access anytime)

---

## 8) OAuth vs Authentication

OAuth is authorization, not authentication 

- Authorization
    - What are you allowed to access?
- Authentication
    - Who are you?

---

# OAuth 2.0

the modern version of OAuth - a protocol that lets apps access user data using tokens instead of passwords

It’s what powers

- Login with “Google”
- Continue with “Facebook”

---

## OAuth vs OAuth 2.o

OAuth1.0 

- Complex
- Required cryptographic siging
- Hard to implement

OAuth 2.0 

- Simpler
- Uses HTTPS instead of complex signatures
- Token-based (Bearer tokens)