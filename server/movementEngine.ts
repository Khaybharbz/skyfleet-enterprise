import {
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import { getRoute } from "../lib/routing";

import { publishEvent } from "./eventBus";

const engines: Record<string, any> =
  {};

/**
 * START ENGINE
 */

export async function startEngine(
  id: string,
  shipment: any
) {
  if (engines[id]) return;

  const start = {
    lat:
      shipment.latitude ||
      6.5244,
    lng:
      shipment.longitude ||
      3.3792,
  };

  const end = {
    lat:
      shipment.destinationLat ||
      6.465422,
    lng:
      shipment.destinationLng ||
      3.406448,
  };

  const route =
    await getRoute(
      start,
      end
    );

  if (
    !route ||
    route.length < 2
  )
    return;

  let index = 0;

  const total =
    route.length - 1;

  engines[id] = setInterval(
    async () => {
      if (index >= total) {
        clearInterval(
          engines[id]
        );

        delete engines[id];

        const finalState = {
          id,
          status: "Delivered",
          progress: 100,
          etaMinutes: 0,
        };

        await updateDoc(
          doc(
            db,
            "shipments",
            id
          ),
          finalState
        );

        publishEvent({
          type: "SHIPMENT_UPDATE",
          payload: finalState,
        });

        return;
      }

      index++;

      const current =
        route[index];

      const next =
        route[
          Math.min(
            index + 1,
            total
          )
        ];

      const progress =
        Math.round(
          (index / total) *
            100
        );

      const speedKmh =
        30 +
        Math.random() * 40;

      const etaMinutes =
        Math.max(
          1,
          Math.round(
            (total - index) /
              8
          )
        );

      const heading =
        Math.atan2(
          next.lng -
            current.lng,
          next.lat -
            current.lat
        );

      const status =
        speedKmh < 40
          ? "Delayed"
          : "Moving";

      const trail = route
        .slice(
          Math.max(
            0,
            index - 15
          ),
          index
        )
        .map((p) => ({
          lat: p.lat,
          lng: p.lng,
        }));

      const update = {
        latitude:
          current.lat,
        longitude:
          current.lng,
        progress,
        etaMinutes,
        speedKmh,
        heading,
        status,
        trail,
      };

      await updateDoc(
        doc(
          db,
          "shipments",
          id
        ),
        update
      );

      publishEvent({
        type: "SHIPMENT_UPDATE",
        payload: {
          id,
          ...update,
        },
      });
    },
    3000
  );
}