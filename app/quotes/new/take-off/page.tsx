"use client";

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
import { dynamicChargesFromPack, linesFromPack } from "@/lib/takeOffLines";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QuoteForm from "@/components/quotes/QuoteForm";
import ProductSelectionModal from "@/components/quotes/ProductSelectionModal";

/**
 * Quoting v1, module 6c. Take-off: items from the template pack, the catalog,
 * or entered by hand. Uses restored QuoteForm for full item builder.
 * Save creates a Draft and opens the draft editor (module 7).
 */

export default function TakeOffPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading…</div>}>
      <TakeOffScreen />
    </Suspense>
  );
}

interface QuoteItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type: "none" | "percentage" | "fixed";
  discount_value: number;
  item_type?: "product" | "service";
}

function TakeOffScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const contactId = params.get("contact_id") ?? "";
  const packId = params.get("pack_id") ?? "";
  const paramsOk = Boolean(clientId && contactId && packId);

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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

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
              product_name: line.name || "",
              quantity: line.quantity,
              unit_price: line.unit_price,
              discount_type: line.discount_type as "none" | "percentage" | "fixed",
              discount_value: line.discount_value,
            }))
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setPackError(err.message || "Could not load the template pack.");
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
        setCatalogError(`Could not load the product catalog: ${err.message}`);
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

  function handleItemChange(index: number, patch: Partial<QuoteItem>) {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
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
    setSaving(true);
    setSaveError(null);
    try {
      const quote = await createDraftQuote({
        client_id: Number(clientId),
        contact_id: Number(contactId),
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
      });
      router.push(`/quotes/${quote.quote_id}/edit`);
    } catch (err) {
      if (hasErrorCode(err, "PRODUCT_NOT_FOUND")) {
        setSaveError("A product in this quote no longer exists. Remove it and try again.");
      } else {
        setSaveError((err as Error).message || "Could not save the draft.");
      }
      setSaving(false);
    }
  }

  if (!paramsOk) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>
            Missing client, contact or template. Start again from the new quote page.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/quotes/new" className="text-accent underline">
            Back to new quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Build Quote"
        subtitle={pack ? `Template: ${pack.name}` : "Add items and charges"}
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes/new">Change template</Link>
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
        clients={[]} // Not used in this flow - client already selected
        selectedClient={null}
        setSelectedClient={() => {}}
        selectedContact={null}
        setSelectedContact={() => {}}
        contacts={[]}
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
        onOpenProductModal={() => setProductModalOpen(true)}
      />

      {saveError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 flex gap-2">
        <Button onClick={handleSave} disabled={!saveAllowed}>
          {saving ? "Saving draft…" : "Save draft"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/quotes/new">Cancel</Link>
        </Button>
      </div>

      <ProductSelectionModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        products={products}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSelect={(product: any) => {
          handleAddItem();
          const newIndex = quoteItems.length;
          handleItemChange(newIndex, {
            product_name: product.product_name,
            unit_price: product.unit_price || 0,
          });
          setProductModalOpen(false);
        }}
      />
    </div>
  );
}
