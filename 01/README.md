## API Caching using Redis

API caching is a technique used to store the response of an API in Redis so that repeated requests can be served much faster without querying the database every time.

### How it works in this project

#### 1. Creating a New User

```bash
app.post("/create", async (req, res) => {
    const { name, email, password } = req.body;

    // Delete the existing cached data
    await redis.del("user:all");

    const user = await User.create({
        name, email, password
    });

    return res.json(user);
});
```

Whenever a new user is created, the cached data stored with the key `user:all` is deleted using:

```bash
await redis.del("user:all");
```

This ensures that the next request fetches the latest data from the database instead of returning outdated cached data.

---

#### 2. Fetching Data Directly from MongoDB

```bashjavascript
app.get("/get", async (req, res) => {
    const user = await User.find({});
    return res.json(user);
});
```

This endpoint always retrieves user data directly from MongoDB without using Redis.

---

#### 3. Fetching Data using Redis Cache

```bash
app.get("/get-redis", async (req, res) => {
    const cached = await redis.get("user:all");

    if (cached) {
        const user = JSON.parse(cached);
        return res.json(user);
    }

    const user = await User.find({});
    await redis.set("user:all", JSON.stringify(user));

    return res.json(user);
});
```

This endpoint follows these steps:

1. Redis first checks whether the key `user:all` already exists using:

   ```bash
   const cached = await redis.get("user:all");
   ```

2. If cached data is available, Redis returns it immediately.

3. Since Redis stores values as strings, the cached data is converted back into JSON using:

   ```bash
   JSON.parse(cached);
   ```

4. If the key is not found in Redis, the application retrieves the data from MongoDB using:

   ```bash
   const user = await User.find({});
   ```

5. The retrieved data is then stored in Redis for future requests:

   ```bash
   await redis.set("user:all", JSON.stringify(user));
   ```

6. Finally, the response is returned to the client.

---

### Flow

```text
Client
   │
   ▼
GET /get-redis
   │
   ▼
Check Redis (user:all)
   │
   ├── Cache Found
   │      ▼
   │   Return Cached Data
   │
   └── Cache Not Found
          ▼
    Fetch from MongoDB
          ▼
 Store Data in Redis
          ▼
 Return Response
```

### Benefits

* Reduces the number of database queries.
* Improves API response time.
* Reduces database load.
* Provides faster responses for repeated requests.

**Performance**

* Retrieval without Redis: **15–25 ms**
* Retrieval with Redis: **3–6 ms**
