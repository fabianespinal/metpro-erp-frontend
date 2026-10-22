"use client";

import { useEffect, useState } from "react";
import { es } from "@/lib/i18n/es";
import { api } from "@/lib/api";

interface Client {
  id: number;
  company_name: string;
}
interface Contact {
  id: number;
  name: string;
  email?: string | null;
}

const selectClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

/**
 * B1: duplicate a quote for the same client (default) or another client and contact.
 * Opened only when the backend switch DUPLICATE_CHANGE_CLIENT_ENABLED is on.
 * onConfirm(null) = same client, no body sent. onConfirm({client_id, contact_id}) = move the copy.
 */
export default function DuplicateQuoteModal({
  open,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (target: { client_id: number; contact_id: number } | null) => void;
  busy?: boolean;
}) {
  const [other, setOther] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !other || clients.length) return;
    api("/clients")
      .then((d) => setClients(Array.isArray(d) ? (d as Client[]) : []))
      .catch((e: Error) => setError(e.message || es.cot.errorClientes));
  }, [open, other, clients.length]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    api(`/contacts/company/${clientId}`)
      .then((d) => {
        if (!cancelled) setContacts(Array.isArray(d) ? (d as Contact[]) : []);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(es.cot.errorContactosCliente(e.message));
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!open) return null;
  const canConfirm = !busy && (!other || Boolean(clientId && contactId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="dup-title">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-card">
        <h2 id="dup-title" className="text-lg font-semibold text-ink">{es.cot.duplicarTitulo}</h2>
        <p className="mt-1 text-sm text-muted">{es.cot.duplicarAviso}</p>

        <div className="mt-4 space-y-2 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input type="radio" name="dup-target" checked={!other} onChange={() => setOther(false)} />
            {es.cot.duplicarMismoCliente}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="dup-target" checked={other} onChange={() => setOther(true)} />
            {es.cot.duplicarOtroCliente}
          </label>
        </div>

        {other && (
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">{es.cot.cliente}</span>
              <select
                className={selectClass}
                value={clientId}
                onChange={(e) => { setClientId(e.target.value); setContactId(""); setContacts([]); }}
              >
                <option value="">{es.cot.seleccioneCliente}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">{es.cot.contacto}</span>
              <select className={selectClass} value={contactId} onChange={(e) => setContactId(e.target.value)} disabled={!clientId}>
                <option value="">{!clientId ? es.cot.seleccioneClientePrimero : contacts.length === 0 ? es.cot.sinContactos : es.cot.seleccioneContacto}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-canvas">
            {es.cot.cancelar}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(other ? { client_id: Number(clientId), contact_id: Number(contactId) } : null)}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {es.cot.duplicarConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
