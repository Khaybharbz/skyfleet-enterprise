
"use client";

import dynamic from "next/dynamic";

const MapInner = dynamic(
  () => import("./MapInner"),
  {
    ssr: false, // 🔥 THIS FIXES "window is not defined"
  }
);

export default function FleetMap({
  nodes,
}: any) {
  return <MapInner nodes={nodes} />;
}