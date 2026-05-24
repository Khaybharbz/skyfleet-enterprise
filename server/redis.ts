
import Redis from "ioredis";

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

/**
 * FLEET STATE STORE
 */
export const FleetStore = {
  async setNode(node: any) {
    await redis.hset(
      "fleet:nodes",
      node.id,
      JSON.stringify(node)
    );
  },

  async getNode(id: string) {
    const data = await redis.hget(
      "fleet:nodes",
      id
    );

    return data ? JSON.parse(data) : null;
  },

  async getAllNodes() {
    const raw = await redis.hgetall(
      "fleet:nodes"
    );

    return Object.values(raw).map(
      (v) => JSON.parse(v)
    );
  },

  async updateDriver(
    id: string,
    lat: number,
    lng: number
  ) {
    const node = await this.getNode(id);

    if (!node) {
      await this.setNode({
        id,
        type: "driver",
        lat,
        lng,
        embedding: Array(6).fill(0),
      });
      return;
    }

    node.lat = lat;
    node.lng = lng;

    await this.setNode(node);
  },
};