import { redis } from "./redis";

const CHANNEL = "skyfleet-events";

export function publishEvent(
  event: any
) {
  redis.publish(
    CHANNEL,
    JSON.stringify(event)
  );
}

export { CHANNEL };