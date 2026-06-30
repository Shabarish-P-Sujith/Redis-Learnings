import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import User from "./model/userModel.js";
import Redis from "ioredis";
import rateLimiter from "./middleware/ratelimit.js";

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
console.log(process.env.MONGODB_URL);

const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;

// we are exporting redis, so that we can it anywhere we want
export const redis = new Redis(process.env.REDIS_URL);

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Hello World, coming from Redis 01!!!!!!!!!"
    });
});

app.post("/create", async (req, res) => {
    const { name, email, password } = req.body;

    // Used to delete the existing user(key value), so that new data entry is possible
    await redis.del("user:all");
    
    const user = await User.create({
        name, email, password
    });
    return res.json(user)
});

// =========================================================
//                    Rate Limiting
// =========================================================
app.get("/get", rateLimiter, async (req, res) => {
    const user = await User.find({});
    return res.json(user)
});

app.get("/get-redis", rateLimiter, async (req, res) => {
    // it will first check whether cached data is there using redis.get()
    const cached = await redis.get("user:all");
    if (cached) {
        const user = JSON.parse(cached);
        return res.json(user);
    }

    // if the cached data is not there, then it will be retrieved from the database
    // and stored inside redis using redis.set()
    const user = await User.find({});
    // redis returns the output in string. So, we need to convert it into JSON
    await redis.set("user:all", JSON.stringify(user)); 

    return res.json(user)
});

const startServer = async () => {
    await connectDB();

    app.listen(port, () => {
        console.log(`Server running at ${port}`);
    });
};

startServer();


// Retrieval time without Redis -> 15ms - 25ms
// Retrieval time with Redis    -> 3ms - 6ms