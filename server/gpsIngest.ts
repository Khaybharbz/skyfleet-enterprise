
import { kafkaProducer } from "./kafka";
import { KAFKA_TOPICS } from "./kafkaTopics";

/**
 * =========================================================
 * MOBILE GPS INGEST API
 * =========================================================
 * POST /gps
 * =========================================================
 */

export async function ingestGPS(req: any, res: any) {
  try {
    const { driverId, lat, lng, speed } =
      req.body;

    if (!driverId || !lat || !lng) {
      return res.status(400).json({
        error: "Invalid GPS payload",
      });
    }

    const event = {
      driverId,
      lat,
      lng,
      speed: speed || 0,
      timestamp: Date.now(),
    };

    /**
     * PUSH INTO KAFKA STREAM
     */
    await kafkaProducer.send({
      topic: KAFKA_TOPICS.GPS_STREAM,
      messages: [
        {
          value: JSON.stringify(event),
        },
      ],
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "GPS ingestion failed",
    });
  }
}