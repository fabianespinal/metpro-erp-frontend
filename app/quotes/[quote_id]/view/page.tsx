"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface QuoteItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type?: string;
  discount_value?: number;
}

interface Quote {
  quote_id: string;
  project_name: string;
  notes: string;
  status: string;
  created_at: string;
  valid_until?: string;
  payment_terms?: string;
  total_amount: number;
  company_name: string;
  company_address?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  items: QuoteItem[];
  included_charges: any;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function calcTotals(items: QuoteItem[], charges: any) {
  const itemsTotal = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0
  );
  let totalDiscounts = 0;
  for (const item of items) {
    const subtotal = item.quantity * item.unit_price;
    if (item.discount_type === "percentage") {
      totalDiscounts += subtotal * ((item.discount_value || 0) / 100);
    } else if (item.discount_type === "fixed") {
      totalDiscounts += item.discount_value || 0;
    }
  }
  const afterDiscount = itemsTotal - totalDiscounts;
  const supervision = charges?.supervision
    ? afterDiscount * ((charges.supervision_percentage || 10) / 100)
    : 0;
  const admin = charges?.admin
    ? afterDiscount * ((charges.admin_percentage || 4) / 100)
    : 0;
  const insurance = charges?.insurance
    ? afterDiscount * ((charges.insurance_percentage || 1) / 100)
    : 0;
  const transport = charges?.transport
    ? afterDiscount * ((charges.transport_percentage || 3) / 100)
    : 0;
  const contingency = charges?.contingency
    ? afterDiscount * ((charges.contingency_percentage || 3) / 100)
    : 0;
  const subtotalGeneral =
    afterDiscount + supervision + admin + insurance + transport + contingency;
  const itbis = subtotalGeneral * 0.18;
  const grandTotal = subtotalGeneral + itbis;

  return {
    itemsTotal,
    totalDiscounts,
    afterDiscount,
    supervision,
    supervisionPct: charges?.supervision_percentage || 10,
    admin,
    adminPct: charges?.admin_percentage || 4,
    insurance,
    insurancePct: charges?.insurance_percentage || 1,
    transport,
    transportPct: charges?.transport_percentage || 3,
    contingency,
    contingencyPct: charges?.contingency_percentage || 3,
    subtotalGeneral,
    itbis,
    grandTotal,
  };
}

export default function QuotePublicView() {
  const params = useParams();
  const quoteId = params?.quote_id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quoteId) return;
    fetch(`${API_URL}/quotes/${quoteId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Quote not found");
        return r.json();
      })
      .then(setQuote)
      .catch(() => setError("No se pudo cargar la cotización."))
      .finally(() => setLoading(false));
  }, [quoteId]);

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div style={styles.centered}>
        <p style={{ color: "#888", fontFamily: "Georgia, serif" }}>{error || "Cotización no encontrada."}</p>
      </div>
    );
  }

  const charges = typeof quote.included_charges === "string"
    ? JSON.parse(quote.included_charges)
    : quote.included_charges || {};

  const t = calcTotals(quote.items || [], charges);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.companyName}>Metpro SRL</div>
          <div style={styles.companyInfo}>Parque Industrial Disdo</div>
          <div style={styles.companyInfo}>Calle Central No. 1, Hato Nuevo Palave</div>
          <div style={styles.companyInfo}>Tel: (829) 439-8476 | RNC: 131-71683-2</div>
        </div>
        <div style={styles.docBadge}>
          <div style={styles.docType}>COTIZACIÓN</div>
          <div style={styles.docId}>{quote.quote_id}</div>
          <div style={styles.docDate}>
            {quote.created_at?.slice(0, 10)}
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Información del Cliente</div>
        <div style={styles.clientGrid}>
          <div>
            <span style={styles.label}>Cliente:</span> {quote.company_name}
          </div>
          <div>
            <span style={styles.label}>Contacto:</span> {quote.contact_name}
          </div>
          <div>
            <span style={styles.label}>Email:</span> {quote.contact_email}
          </div>
          <div>
            <span style={styles.label}>Teléfono:</span> {quote.contact_phone}
          </div>
          {quote.project_name && (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={styles.label}>Proyecto:</span> {quote.project_name}
            </div>
          )}
          {quote.valid_until && (
            <div>
              <span style={styles.label}>Válido hasta:</span> {quote.valid_until}
            </div>
          )}
          {quote.payment_terms && (
            <div>
              <span style={styles.label}>Términos de pago:</span> {quote.payment_terms}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Detalle de Items</div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={{ ...styles.th, textAlign: "left" }}>Descripción</th>
              <th style={styles.th}>Cantidad</th>
              <th style={styles.th}>Precio Unit.</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => {
              const lineTotal = item.quantity * item.unit_price;
              return (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={{ ...styles.td, textAlign: "left" }}>{item.product_name}</td>
                  <td style={styles.td}>{item.quantity.toFixed(2)}</td>
                  <td style={styles.td}>{fmt(item.unit_price)}</td>
                  <td style={styles.td}>{fmt(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={styles.totalsWrapper}>
        <div style={styles.totalsBox}>
          <div style={styles.sectionTitle}>Resumen Financiero</div>
          <div style={styles.totalRow}>
            <span>Subtotal de Items</span>
            <span>{fmt(t.itemsTotal)}</span>
          </div>
          {t.totalDiscounts > 0 && (
            <div style={styles.totalRow}>
              <span>Descuentos</span>
              <span>-{fmt(t.totalDiscounts)}</span>
            </div>
          )}
          {charges?.supervision && (
            <div style={styles.totalRow}>
              <span>Supervisión ({t.supervisionPct}%)</span>
              <span>{fmt(t.supervision)}</span>
            </div>
          )}
          {charges?.admin && (
            <div style={styles.totalRow}>
              <span>Administración ({t.adminPct}%)</span>
              <span>{fmt(t.admin)}</span>
            </div>
          )}
          {charges?.insurance && (
            <div style={styles.totalRow}>
              <span>Seguro ({t.insurancePct}%)</span>
              <span>{fmt(t.insurance)}</span>
            </div>
          )}
          {charges?.transport && (
            <div style={styles.totalRow}>
              <span>Transporte ({t.transportPct}%)</span>
              <span>{fmt(t.transport)}</span>
            </div>
          )}
          {charges?.contingency && (
            <div style={styles.totalRow}>
              <span>Contingencia ({t.contingencyPct}%)</span>
              <span>{fmt(t.contingency)}</span>
            </div>
          )}
          <div style={styles.totalRow}>
            <span>Subtotal General</span>
            <span>{fmt(t.subtotalGeneral)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>ITBIS (18%)</span>
            <span>{fmt(t.itbis)}</span>
          </div>
          <div style={styles.grandTotalRow}>
            <span>TOTAL GENERAL</span>
            <span>{fmt(t.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Notas</div>
          <p style={styles.notes}>{quote.notes}</p>
        </div>
      )}

      <div style={styles.footer}>
        Generado por METPRO · metprord.com
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
    minHeight: "100vh",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #e0e0e0",
    borderTop: "3px solid #1a1a1a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2px solid #1a1a1a",
    paddingBottom: 24,
    marginBottom: 32,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 13,
    color: "#555",
    lineHeight: 1.6,
  },
  docBadge: {
    textAlign: "right",
  },
  docType: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#1a1a1a",
  },
  docId: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  docDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#888",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: 8,
    marginBottom: 16,
    fontFamily: "system-ui, sans-serif",
  },
  clientGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 24px",
    fontSize: 14,
    lineHeight: 1.8,
  },
  label: {
    fontWeight: "bold",
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  tableHead: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  th: {
    padding: "10px 12px",
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "right",
  },
  td: {
    padding: "10px 12px",
    textAlign: "right",
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
  },
  trEven: {
    backgroundColor: "#fff",
  },
  trOdd: {
    backgroundColor: "#f5f5f5",
  },
  totalsWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 32,
  },
  totalsBox: {
    width: 360,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: 14,
    fontFamily: "system-ui, sans-serif",
    borderBottom: "1px solid #f0f0f0",
  },
  grandTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0 6px",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "system-ui, sans-serif",
    borderTop: "2px solid #1a1a1a",
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#444",
    fontFamily: "system-ui, sans-serif",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 40,
  },
  downloadBtn: {
    display: "inline-block",
    padding: "12px 32px",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 1,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#aaa",
    fontFamily: "system-ui, sans-serif",
    borderTop: "1px solid #e0e0e0",
    paddingTop: 24,
  },
};
