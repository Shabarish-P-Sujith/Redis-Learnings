## OTP Generation and Verification using Redis

Redis can be used to temporarily store One-Time Passwords (OTPs). Since OTPs are valid only for a short period, Redis is an ideal choice because it supports automatic expiration of keys.

### How it works in this project

#### 1. Generating and Storing OTP

```bash
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`otp:${email}`, otp, "EX", 30);

    return res.json({ otp });
});
```

This endpoint performs the following steps:

1. Receives the user's email from the request body.

2. Generates a random 6-digit OTP using:

```bash
Math.floor(100000 + Math.random() * 900000).toString();
```

3. Stores the OTP in Redis with a key based on the user's email:

```bash
otp:<email>
```

Example:

```text
   Key   : otp:john@gmail.com
   Value : 483721
```

4. The OTP is stored with an expiry time of **30 seconds** using:

```bash
   await redis.set(`otp:${email}`, otp, "EX", 30);
```

5. Finally, the generated OTP is returned in the response.

---

#### 2. Verifying OTP

```bash
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    const cachedOtp = await redis.get(`otp:${email}`);

    if (!cachedOtp) {
        return res.status(400).json({
            message: "OTP is expired --OR-- is not found"
        });
    }

    if (cachedOtp != otp) {
        return res.status(400).json({
            message: "incorrect OTP"
        });
    }

    await redis.del(`otp:${email}`);

    return res.json({
        message: "Success.... OTP verified !!"
    });
});
```

This endpoint performs the following steps:

1. Receives the user's email and OTP.

2. Retrieves the stored OTP from Redis using:

   ```bash
   await redis.get(`otp:${email}`);
   ```

3. If no OTP is found, it means the OTP has either expired or does not exist.

4. If the entered OTP does not match the stored OTP, an error message is returned.

5. If the OTP matches successfully, the stored OTP is deleted using:

```bash
await redis.del(`otp:${email}`);
```

This prevents the same OTP from being used again.

6. Finally, a success message is returned.

---

### Flow

```text
Client
   │
   ▼
POST /send-otp
   │
Generate 6-digit OTP
   │
Store OTP in Redis
(Key: otp:<email>, Expiry: 30 sec)
   │
Return OTP
```

```text
Client
   │
   ▼
POST /verify-otp
   │
Retrieve OTP from Redis
   │
   ├── OTP Not Found
   │      ▼
   │  Expired / Invalid
   │
   └── OTP Found
          │
          ▼
     Compare OTP
          │
      ├── Incorrect
      │      ▼
      │  Return Error
      │
      └── Correct
             ▼
     Delete OTP from Redis
             ▼
      Return Success
```

### Benefits

* OTPs automatically expire after **30 seconds**.
* No need to manually remove expired OTPs.
* Fast OTP retrieval using Redis.
* Prevents OTP reuse by deleting it after successful verification.
* Suitable for authentication and email/phone verification systems.
