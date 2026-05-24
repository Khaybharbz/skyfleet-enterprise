"use client";

import { ReactNode } from "react";

export default function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {title && (
        <div className="text-sm text-zinc-400 mb-2">
          {title}
        </div>
      )}

      {children}
    </div>
  );
}