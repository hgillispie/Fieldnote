"use client";

import { useSyncExternalStore } from "react";
import { isEditing } from "@builder.io/sdk-react";

const subscribe = () => () => {};

interface EditorEmptyStateProps {
  message: string;
  attributes?: Record<string, unknown>;
}

/**
 * Shown only inside Builder's Visual Editor when a component has nothing to
 * render, so editors can still select it. Live visitors get nothing rather
 * than invented fallback copy.
 */
export function EditorEmptyState({ message, attributes }: EditorEmptyStateProps) {
  const editing = useSyncExternalStore(subscribe, () => isEditing(), () => false);
  if (!editing) return null;

  return (
    <div
      {...attributes}
      className="rounded-lg border border-dashed border-slate/40 bg-surface-alt px-6 py-10 text-center text-sm text-slate"
    >
      {message}
    </div>
  );
}
