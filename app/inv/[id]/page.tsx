import { redirect } from "next/navigation";

// E-10: the ERP copy of the public invoice page was broken (Next 16 passes params as a promise,
// so it called /invoices/public/undefined). Customers always use the public site, so send
// anyone who lands here to the same invoice there.
const PUBLIC_SITE = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://metprord.site";

export default async function PublicInvoiceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`${PUBLIC_SITE.replace(/\/$/, "")}/inv/${encodeURIComponent(id)}`);
}
