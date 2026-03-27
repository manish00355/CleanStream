const { Queue } = require("bullmq");
const { Redis } = require("ioredis");

// Redis connection shared by BullMQ and other Redis operations (e.g. rate limiting)
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // required by BullMQ — do NOT remove
});

redisConnection.on("connect", () => console.log("[Redis] Connected"));
redisConnection.on("error",   (e) => console.error("[Redis] Error:", e.message));

//  BullMQ moderation queue 
// Python ML worker consumes jobs from this queue.
// Queue name MUST stay "moderation" — ML team reads this exact name.
const moderationQueue = new Queue("moderation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff:  { type: "exponential", delay: 2000 }, // retry: 2s → 4s → 8s
    removeOnComplete: 100,   // keep last 100 completed jobs for debugging
    removeOnFail:      50,
  },
});

module.exports = { redisConnection, moderationQueue };
