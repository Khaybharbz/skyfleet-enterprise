"use client";

import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";

import { useEffect, useRef, useState } from "react";

/**
 * =========================
 * TYPES
 * =========================
 */
type Node = {
  id: string;
  lat: number;
  lng: number;

  speed?: number;
  etaSeconds?: number;
  battery?: number;

  path?: {
    lat: number;
    lng: number;
  }[];
};

/**
 * =========================
 * UTILS (SMOOTH INTERPOLATION)
 * =========================
 */
const lerp = (a: number, b: number, t: number) =>
  a + (b - a) * t;

/**
 * =========================
 * COMPONENT
 * =========================
 */
export default function MapInner({
  nodes,
}: {
  nodes: Node[];
}) {
  /**
   * Animated state (what map renders)
   */
  const [renderNodes, setRenderNodes] = useState<
    Record<string, Node>
  >({});

  /**
   * Previous positions reference (source of truth for animation)
   */
  const prevNodesRef = useRef<Record<string, Node>>({});

  /**
   * Animation frame control
   */
  const frameRef = useRef<number | null>(null);

  /**
   * =========================
   * SYNC INCOMING DATA
   * =========================
   */
  useEffect(() => {
    const prev = prevNodesRef.current;

    const next: Record<string, Node> = {};

    nodes.forEach((n) => {
      next[n.id] = n;
    });

    /**
     * Start animation between prev → next
     */
    animateTransition(prev, next);

    prevNodesRef.current = next;
  }, [nodes]);

  /**
   * =========================
   * ANIMATION ENGINE (SMOOTH MOVE)
   * =========================
   */
  const animateTransition = (
    from: Record<string, Node>,
    to: Record<string, Node>
  ) => {
    const duration = 1000; // 1 second smooth motion
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(
        (now - start) / duration,
        1
      );

      const updated: Record<string, Node> = {};

      Object.keys(to).forEach((id) => {
        const startNode = from[id] || to[id];
        const targetNode = to[id];

        updated[id] = {
          ...targetNode,
          lat: lerp(
            startNode.lat,
            targetNode.lat,
            t
          ),
          lng: lerp(
            startNode.lng,
            targetNode.lng,
            t
          ),
        };
      });

      setRenderNodes(updated);

      if (t < 1) {
        frameRef.current =
          requestAnimationFrame(step);
      }
    };

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current =
      requestAnimationFrame(step);
  };

  /**
   * =========================
   * CLEANUP
   * =========================
   */
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(
          frameRef.current
        );
      }
    };
  }, []);

  return (
    <MapContainer
      center={[6.5244, 3.3792]} // Lagos default
      zoom={12}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      {/* =========================
          BASE MAP
      ========================= */}
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* =========================
          GEOFENCE (CONTROL ZONE)
      ========================= */}
      <Circle
        center={[6.5244, 3.3792]}
        radius={2500}
        pathOptions={{
          color: "green",
          fillOpacity: 0.08,
        }}
      />

      {/* =========================
          ROUTE TRAILS
      ========================= */}
      {Object.values(renderNodes).map(
        (node) =>
          node.path &&
          node.path.length > 1 ? (
            <Polyline
              key={`route-${node.id}`}
              positions={node.path.map(
                (p) => [p.lat, p.lng]
              )}
              pathOptions={{
                color: "#3b82f6",
                weight: 4,
                opacity: 0.7,
              }}
            />
          ) : null
      )}

      {/* =========================
          LIVE VEHICLES (SMOOTH)
      ========================= */}
      {Object.values(renderNodes).map(
        (node) => (
          <Marker
            key={node.id}
            position={[
              node.lat,
              node.lng,
            ]}
          >
            <Popup>
              <div className="space-y-1">
                <div>
                  <b>🚚 {node.id}</b>
                </div>

                <div>
                  Speed:{" "}
                  {node.speed || 0}{" "}
                  km/h
                </div>

                <div>
                  ETA:{" "}
                  {node.etaSeconds
                    ? `${Math.round(
                        node.etaSeconds /
                          60
                      )} min`
                    : "N/A"}
                </div>

                <div>
                  Battery:{" "}
                  {node.battery || 100}
                  %
                </div>
              </div>
            </Popup>
          </Marker>
        )
      )}
    </MapContainer>
  );
}