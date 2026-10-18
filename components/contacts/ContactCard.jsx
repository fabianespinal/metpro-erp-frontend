import { es } from "@/lib/i18n/es";
import { useRouter } from "next/navigation";

export default function ContactCard({ contact, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <div className="bg-surface border border-line rounded-lg p-5 shadow-card hover:shadow-card transition-shadow">
      <h2 className="text-lg font-semibold text-ink">{contact.name}</h2>

      <div className="text-sm text-muted mt-2 space-y-1">
        {contact.email && <p>{es.con.correo} {contact.email}</p>}
        {contact.phone && <p>{es.con.telefono} {contact.phone}</p>}
        {contact.company_name && (
          <p className="text-accent font-medium">{es.con.empresa} {contact.company_name}</p>
        )}
      </div>

      <div className="flex gap-3 mt-5 flex-wrap">
        <button
          onClick={() => router.push(`/quotes?contactId=${contact.id}&companyId=${contact.company_id}`)}
          className="px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent-strong transition"
        >
          {es.con.usarEnCotizacion}
        </button>

        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-canvas text-ink rounded-md hover:bg-canvas transition"
        >
          {es.con.editar}
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          {es.con.eliminar}
        </button>
      </div>
    </div>
  );
}