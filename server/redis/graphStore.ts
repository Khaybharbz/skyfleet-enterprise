import Redis from "ioredis";

const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

export type FleetNode = {
  id: string;
  lat: number;
  lng: number;
  speed?: number;
  timestamp?: number;
};

const KEY = "fleet:graph:state";

export async function getGraphState() {
  const data = await redis.get(KEY);
  return data ? JSON.parse(data) : { nodes: [] };
}

export async function saveGraphState(state: any) {
  await redis.set(KEY, JSON.stringify(state));
}

export async function upsertNode(node: FleetNode) {
  const state = await getGraphState();

  const index = state.nodes.findIndex(
    (n: FleetNode) => n.id === node.id
  );

  if (index >= 0) state.nodes[index] = node;
  else state.nodes.push(node);

  await saveGraphState(state);

  return node;
}