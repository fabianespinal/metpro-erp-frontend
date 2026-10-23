"use client";

import { useEffect, useState } from "react";
import { fetchStatusHistory, lastChangeText, type HistoryKind } from "@/lib/statusHistory";
import StatusActor from "@/components/StatusActor";

/**
 * Detail pages: loads the history once and shows the last change under the status.
 * Renders nothing while the history is off or empty (the page then looks exactly as before).
 * `refreshKey` (the current status) reloads it after a status change.
 */
export default function StatusHistoryLink({ kind, id, refreshKey, label }: { kind: HistoryKind; id: string | number; refreshKey?: string; label?: string }) {
  const [last, setLast] = useState<{ by: string | null; at: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStatusHistory(kind, id)
      .then((h) => {
        if (!alive) return;
        const top = h.enabled ? h.entries[0] : undefined;
        setLast(top ? { by: top.actor_name, at: top.changed_at } : null);
      })
      .catch(() => alive && setLast(null));
    return () => {
      alive = false;
    };
  }, [kind, id, refreshKey]);

  if (!last || !lastChangeText(last.by, last.at)) return null;
  const actor = <StatusActor kind={kind} id={id} lastBy={last.by} lastAt={last.at} />;
  return label ? (
    <div>
      <span className="font-semibold">{label}</span> {actor}
    </div>
  ) : (
    actor
  );
}
