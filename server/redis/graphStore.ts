import Redis from "ioredis";

export const redis = new Redis({
  host: "localhost",
  port: 6379,
});

/**
 * Store node in partitioned graph
 */
export async function upsertNode(
  id: string,
  node: any
) {
  await redis.hset(
    "stgat:nodes",
    id,
    JSON.stringify(node)
  );
}

export async function getAllNodes() {
  const data = await redis.hgetall(
    "stgat:nodes"
  );

  return Object.values(data).map((n) =>
    JSON.parse(n)
  );
}