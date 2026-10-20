"use client";

import { useEffect, useState } from "react";
import { getSealSettings, type SealSettings } from "@/lib/sealApi";

// One request per page session, shared by every dialog. A failed load is not cached, so the next
// dialog tries again. Fail closed: with no answer there is no checkbox and no seal.
let cached: SealSettings | null = null;
let inflight: Promise<SealSettings | null> | null = null;

export function setSealSettingsCache(settings: SealSettings | null): void {
  cached = settings;
  inflight = null;
}

function load(): Promise<SealSettings | null> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getSealSettings()
      .then((s) => {
        cached = s;
        return s;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** The result a dialog needs: is there a seal, and is it pre-checked. */
export function sealState(settings: SealSettings | null) {
  const configured = !!settings?.configured;
  return { configured, enabledByDefault: configured && !!settings?.enabled_by_default };
}

/**
 * Seal status for a document dialog. Pass `enabled` = the dialog is open, so closed dialogs
 * (one per table row) do not trigger a request.
 */
export function useSealSettings(enabled: boolean = true) {
  const [settings, setSettings] = useState<SealSettings | null>(cached);
  const [ready, setReady] = useState<boolean>(cached !== null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    load().then((s) => {
      if (!active) return;
      setSettings(s);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { ready, ...sealState(settings) };
}
