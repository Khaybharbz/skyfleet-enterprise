import {
  getAllNodes,
} from "@/server/redis/graphStore";

export async function POST(req: Request) {
  const { shipmentId } = await req.json();

  const nodes = await getAllNodes();

  const shipment = nodes.find(
    (n) => n.id === shipmentId
  );

  if (!shipment) {
    return Response.json({
      status: "NO_SHIPMENT",
    });
  }

  const drivers = nodes.filter(
    (n) => n.type === "driver"
  );

  const scored = drivers.map((d) => {
    let score = 0;

    for (let i = 0; i < 6; i++) {
      score +=
        (d.h?.[i] || 0) *
        (shipment.h?.[i] || 0);
    }

    return {
      driverId: d.id,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return Response.json({
    shipmentId,
    driverId: scored[0]?.driverId,
    score: scored[0]?.score,
    status: "KAFKA_REDIS_STGAT_ASSIGNED",
  });
}