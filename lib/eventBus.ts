import { redis } from "./redis";

/**
 * CHANNEL NAME
 */

const CHANNEL = "skyfleet-events";

/**
 * =========================================
 * PUBLISH EVENT
 * =========================================
 */

export function publishEvent(
  event: any
) {
  redis.publish(
    CHANNEL,
    JSON.stringify(event)
  );
}

/**
 * =========================================
 * CHANNEL EXPORT
 * =========================================
 */

export { CHANNEL };