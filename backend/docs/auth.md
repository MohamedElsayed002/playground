

## Authenticaiton 

**Register** 

1. Check email + username are unique 
2. bcrypt.hast(password,10) -> store hash
3. Create User + Profile in one transaction
4. Issue accessToken (JWT 15 min) + refreshToken (7 days)
5. Store refreshToken as a bcrypt hash in refresh_token table 
6. Return both tokens + profile to client 

**Login** 

1. Find user by email 
2. bcrypt.compare(plain,hash) -> verify password 
3. Issue + store new token pair (same as register step 4-6)

**Refresh (silent re-login while app is open)**

1. Client sends raw refreshToken 
2. We find all non-expired tokens for this user and bcrypt.compare each
3. Delete matched token (TOKEN Rotation - each token is single use)
4. Issue a brand-new token pair  -> A stolen refresh token can only be used once before the real user invalidates it on their next auto-refresh

**Logout**

1. Find + delete the refresh token row 
    -> The access_token expires naturally within 15 mintues 
    -> Logout all devices: delete all refresh_tokens rows for this user
