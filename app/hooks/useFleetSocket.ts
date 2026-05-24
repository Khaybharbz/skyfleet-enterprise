"use client";

import { useEffect } from "react";

export function useFleetSocket(
  onMessage: (data: any) => void
) {
  useEffect(() => {
    const ws = new WebSocket(
      "ws://localhost:8080"
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        onMessage(data);
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      ws.close();
    };
  }, [onMessage]);
}