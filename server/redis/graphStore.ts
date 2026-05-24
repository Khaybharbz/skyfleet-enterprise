let RedisClient: any;
let redis: any;

try {
  RedisClient = require("ioredis");

  redis = new RedisClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: 2
  });
} catch (err) {
  console.warn("Redis not available — using mock store");

  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    hset: async () => null,
    hget: async () => null,
    publish: async () => null,
    subscribe: async () => null
  };
}

export { redis };