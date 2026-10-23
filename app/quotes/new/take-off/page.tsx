"use client";

import { es } from "@/lib/i18n/es";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  DEFAULT_INCLUDED_CHARGES,
  createDraftQuote,
  getTemplatePack,
  hasErrorCode,
  type IncludedCharges,
  type TemplatePack,
} from "@/lib/quotingApi";
import { dynamicChargesFromPack, itemProblem, linesFromPack } from "@/lib/takeOffLines";
import { applyItemChange } from "@/lib/quoteItemEdit";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QuoteForm from "@/components/quotes/QuoteForm";
import QuoteCostEstimate from "@/components/quotes/QuoteCostEstimate";
import ProductSelectionModal from "@/components/quotes/ProductSelectionModal";
import { PrintItemsToggle } from "@/components/quotes/PrintItemsToggle";

/**
 * Quoting v1, module 6c. Take-off: items from the template pack, the catalog,
 * or entered by hand. Uses restored QuoteForm for full item builder.
 * Save creates a Draft and opens the draft editor (module 7).
 */

export default function TakeOffPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">{es.cot.cargando}</div>}>
      <TakeOffScreen />
    </Suspense>
  );
}

interface QuoteItem {
  product_id?: number | null; // catalog link; kept so cost estimates and reports can find the product
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type: "none" | "percentage" | "fixed";
  discount_value: number;
  item_type?: "product" | "service";
  category?: string | null;
  unit_of_measure?: string | null; // Medidas; omitted = the backend takes the product's unit
}

function TakeOffScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const contactId = params.get("contact_id") ?? "";
  const packId = params.get("pack_id") ?? "";
  const paramsOk = Boolean(clientId && contactId && packId);

  const [client, setClient] = useState<{ id: number; company_name: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contacts, setContacts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [pack, setPack] = useState<TemplatePack | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [charges, setCharges] = useState<IncludedCharges>({
    ...DEFAULT_INCLUDED_CHARGES,
    dynamic_charges: [],
  });
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const [printItems, setPrintItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Step 1 already chose the client and contact. Load both here so nothing is re-selected.
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    api(`/clients/${clientId}`)
      .then((data) => {
        if (!cancelled) setClient(data as { id: number; company_name: string });
      })
      .catch((err: Error) => {
        if (!cancelled) setSaveError(es.cot.errorCliente(err.message));
      });
    api(`/contacts/company/${clientId}`)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setContacts(list);
        setSelectedContact(list.find((c: { id: number }) => String(c.id) === contactId) ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) setSaveError(es.cot.errorContactos(err.message));
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, contactId]);

  // Load the template pack and seed items from it.
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    getTemplatePack(Number(packId))
      .then((p) => {
        if (cancelled) return;
        setPack(p);
        // Pack charges become the quote's dynamic charges (max 3). Editable on this screen.
        setCharges((prev) => ({ ...prev, dynamic_charges: dynamicChargesFromPack(p) }));
        const lines = linesFromPack(p);
        setQuoteItems(
          lines
            .filter((line) => line.include) // Only include selected items
            .map((line) => ({
              product_id: line.product_id,
              product_name: line.name || "",
              quantity: line.quantity,
              unit_price: line.unit_price,
              discount_type: line.discount_type as "none" | "percentage" | "fixed",
              discount_value: line.discount_value,
              category: line.category,
            }))
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setPackError(err.message || es.cot.errorPlantilla);
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  // Load the product catalog for "add product".
  useEffect(() => {
    let cancelled = false;
    api("/products/")
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProducts([]);
        setCatalogError(es.cot.errorCatalogo(err.message));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAllowed = quoteItems.length > 0 && paramsOk && !saving;

  function handleAddItem() {
    setQuoteItems([
      ...quoteItems,
      { product_name: "", quantity: 1, unit_price: 0, discount_type: "none", discount_value: 0 },
    ]);
  }

  function handleRemoveItem(index: number) {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Accepts (index, patch) and (index, "field", value). Local state only, so discounts
  // and totals update instantly, before anything is saved.
  function handleItemChange(index: number, fieldOrPatch: string | Partial<QuoteItem>, value?: unknown) {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? applyItemChange(item, fieldOrPatch, value) : item))
    );
  }

  function handleChargeToggle(key: keyof IncludedCharges) {
    setCharges((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleChargePercentageChange(key: string, value: number) {
    setCharges((prev) => ({ ...prev, [`${key}_percentage`]: value }));
  }

  async function handleSave() {
    if (!saveAllowed) return;
    // Same rules as the draft editor: a blank name or zero quantity would save a draft
    // that the editor then refuses to save again.
    for (let i = 0; i < quoteItems.length; i++) {
      const problem = itemProblem(quoteItems[i]);
      if (problem) {
        setSaveError(`${es.cot.articuloN} ${i + 1}: ${problem}`);
        return;
      }
    }
    setSaving(true);
    setSaveError(null);
    try {
      const quote = await createDraftQuote({
        client_id: Number(clientId),
        contact_id: selectedContact?.id ?? Number(contactId),
        project_name: projectName.trim() || null,
        notes: notes.trim() || null,
        payment_terms: paymentTerms.trim() || null,
        valid_until: validUntil || null,
        items: quoteItems.map((item) => ({
          ...item,
          discount_type: item.discount_type || "none",
          item_type: item.item_type || "product",
        })),
        included_charges: charges,
        ...(printItems ? {} : { print_items: false }),
      });
      router.push(`/quotes/${quote.quote_id}/edit`);
    } catch (err) {
      if (hasErrorCode(err, "PRODUCT_NOT_FOUND")) {
        setSaveError(es.cot.productoNoExiste);
      } else {
        setSaveError((err as Error).message || es.cot.errorBorrador);
      }
      setSaving(false);
    }
  }

  if (!paramsOk) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>
            {es.cot.faltaDatos}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/quotes/new" className="text-accent underline">
            {es.cot.volverNueva}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title={es.cot.armarTitulo}
        subtitle={pack ? es.cot.plantillaSel(pack.name) : es.cot.armarSubtitulo}
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes/new">{es.cot.cambiarPlantilla}</Link>
          </Button>
        }
      />

      {packError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{packError}</AlertDescription>
        </Alert>
      ) : null}

      {catalogError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{catalogError}</AlertDescription>
        </Alert>
      ) : null}

      <QuoteForm
        clients={client ? [client] : []}
        selectedClient={client}
        setSelectedClient={() => {}}
        clientLocked
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        contacts={contacts}
        projectName={projectName}
        setProjectName={setProjectName}
        quoteItems={quoteItems}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        handleItemChange={handleItemChange}
        charges={charges}
        setCharges={setCharges}
        notes={notes}
        setNotes={setNotes}
        paymentTerms={paymentTerms}
        setPaymentTerms={setPaymentTerms}
        validUntil={validUntil}
        setValidUntil={setValidUntil}
        onSubmit={handleSave}
        loading={saving}
        onOpenProductModal={(index?: number) => {
          // Remember which row asked, so the chosen product fills that row.
          setModalIndex(typeof index === "number" ? index : null);
          setProductModalOpen(true);
        }}
      />

      <QuoteCostEstimate
        className="mt-4"
        items={quoteItems.map((item) => ({
          ...item,
          discount_type: item.discount_type || "none",
          item_type: item.item_type || "product",
        }))}
        charges={charges}
      />

      <div className="mt-4">
        <PrintItemsToggle checked={printItems} onChange={setPrintItems} disabled={saving} />
      </div>

      {saveError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 flex gap-2">
        <Button onClick={handleSave} disabled={!saveAllowed}>
          {saving ? es.cot.guardandoBorrador : es.cot.guardarBorrador}
        </Button>
        <Button asChild variant="outline">
          <Link href="/quotes/new">{es.cot.cancelar}</Link>
        </Button>
      </div>

      <ProductSelectionModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        products={products}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSelect={(product: any) => {
          const patch = {
            product_id: product.id ?? null,
            product_name: product.name ?? product.product_name ?? "",
            unit_price: Number(product.unit_price) || 0,
            unit_of_measure: product.unit_of_measure ?? "",
          };
          if (modalIndex !== null && modalIndex >= 0 && modalIndex < quoteItems.length) {
            // Fill the row the user clicked. Quantity and discount stay as typed.
            handleItemChange(modalIndex, patch);
          } else {
            handleAddItem();
            handleItemChange(quoteItems.length, patch);
          }
          setProductModalOpen(false);
          setModalIndex(null);
        }}
      />
    </div>
  );
}
