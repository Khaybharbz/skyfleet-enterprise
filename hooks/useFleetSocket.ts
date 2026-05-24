
"use client";

import { useEffect, useRef } from "react";

type FleetNode = {
  id: string;
  type: "driver" | "shipment";
  lat: number;
  lng: number;
  timestamp?: number;
};

type FleetAction = any;

type FleetState = {
  nodes: FleetNode[];
  actions: FleetAction[];
};

type FleetEvent =
  | {
      type: "INIT_STATE";
      payload: FleetState;
    }
  | {
      type: "NODE_UPDATE";
      payload: FleetNode;
    }
  | {
      type: "ACTION_EVENT";
      payload: FleetAction;
    };

export function useFleetSocket(
  onUpdate: (state: FleetState) => void
) {
  const stateRef = useRef<FleetState>({
    nodes: [],
    actions: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = () => {
    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;

      ws.send(
        JSON.stringify({
          type: "SUBSCRIBE_FLEET",
        })
      );
    };

    ws.onmessage = (event) => {
      const msg: FleetEvent = JSON.parse(
        event.data
      );

      const state = stateRef.current;

      /**
       * =========================
       * INIT SNAPSHOT
       * =========================
       */
      if (msg.type === "INIT_STATE") {
        state.nodes = msg.payload.nodes || [];
        state.actions = msg.payload.actions || [];
      }

      /**
       * =========================
       * NODE UPDATE (GPS STREAM)
       * =========================
       */
      if (msg.type === "NODE_UPDATE") {
        const node = msg.payload;

        const idx = state.nodes.findIndex(
          (n) => n.id === node.id
        );

        if (idx >= 0) {
          state.nodes[idx] = {
            ...state.nodes[idx],
            ...node,
          };
        } else {
          state.nodes.push(node);
        }
      }

      /**
       * =========================
       * ACTION EVENTS
       * =========================
       */
      if (msg.type === "ACTION_EVENT") {
        state.actions.push(msg.payload);
      }

      onUpdate({ ...state });
    };

    ws.onclose = () => {
      const delay = Math.min(
        1000 * 2 ** retryRef.current,
        10000
      );

      retryRef.current++;

      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  useEffect(() => {
    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);
}