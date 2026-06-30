## Rate Limiting using Redis

- Rate limiting is a technique used to control the number of requests a client can make to an API within a specific time period. 
- It helps protect the server from :
   - Excessive requests 
   - Bot abuse(fake internet traffic)
   - Brute Force attacks 
   - DDoS attacks.

### How it works in this project

#### 1. Applying the Rate Limiter Middleware

```javascript
app.get("/get", rateLimiter, async (req, res) => {
    const user = await User.find({});
    return res.json(user);
});

app.get("/get-redis", rateLimiter, async (req, res) => {
    ...
});
```

The `rateLimiter` middleware is added before the route handler. Every request to these endpoints must pass through the middleware before accessing the API.

---

#### 2. Identifying the Client

```javascript
const ip = req.ip;
const key = `rate_limit:${ip}`;
```

- The client's IP address is obtained using `req.ip`.
- A unique Redis key is then created for each client:

```text
rate_limit:127.0.0.1
```

This key is used to keep track of how many requests the client has made.

---

#### 3. Counting Requests

```javascript
const requests = await redis.incr(key);
```

The `INCR` command increases the request count by **1** every time the client sends a request.

Example:

```text
Request 1 → 1
Request 2 → 2
Request 3 → 3
...
```

---

#### 4. Setting an Expiration Time

```javascript
if (requests == 1) {
    await redis.expire(key, 20);
}
```

- When the first request is received, an expiration time of **20 seconds** is assigned to the Redis key.
- After 20 seconds, Redis automatically deletes the key and the request counter resets to zero.

---

#### 5. Blocking Excess Requests

```javascript
if (requests > 5) {
    return res.status(429).json({
        message: "Too many Requests"
    });
}
```

If the request count becomes greater than **5** within the 20-second window, the API returns:

```json
{
    "message": "Too many Requests"
}
```

with HTTP status code **429 (Too Many Requests)**.

---

#### 6. Allowing Valid Requests

```javascript
next();
```

If the request count is **5 or less**, the middleware calls `next()` and passes control to the actual API route.

---

### Flow

```text
Client
   │
   ▼
Request API
   │
   ▼
Get Client IP
   │
   ▼
Increase Request Count (INCR)
   │
   ▼
First Request?
   │
   ├── Yes
   │      ▼
   │  Set Expiry = 20 sec
   │
   └── No
          │
          ▼
Is Request Count > 5 ?
   │
   ├── Yes
   │      ▼
   │ Return 429 Too Many Requests
   │
   └── No
          ▼
      next()
          ▼
    Execute API
```

### Benefits

* Limits the number of requests from a single client.
* Protects the server from excessive traffic.
* Prevents abuse of API endpoints.
* Automatically resets the request counter after **20 seconds** (we can give the `seconds` according to our comfort) using Redis key expiration.
