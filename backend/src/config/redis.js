const { Queue } = require("bullmq");
const { Redis } = require("ioredis");


const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, 
});

redisConnection.on("connect", () => console.log("[Redis] Connected"));
redisConnection.on("error",   (e) => console.error("[Redis] Error:", e.message));

//  BullMQ moderation queue 


const moderationQueue = new Queue("moderation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff:  { type: "exponential", delay: 2000 }, 
    removeOnComplete: 100,  
    removeOnFail:      50,
  },
});

module.exports = { redisConnection, moderationQueue };
