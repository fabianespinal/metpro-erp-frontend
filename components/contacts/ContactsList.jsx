import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";

export default function ContactsList({ contacts, onEdit, onDelete }) {
  const router = useRouter();

  if (!contacts || contacts.length === 0) {
    return <p className="text-muted">No hay contactos registrados.</p>;
  }

  return (
    <div className="bg-surface shadow rounded-md overflow-hidden">
      <table className={dt.table}>
        <thead className={dt.thead}>
          <tr>
            <th className={dt.th}>Nombre</th>
            <th className={dt.th}>{es.con.colCorreo}</th>
            <th className={dt.th}>Teléfono</th>
            <th className={dt.th}>Acciones</th>
          </tr>
        </thead>

        <tbody className={dt.tbody}>
          {contacts.map((c) => (
            <tr key={c.id} className={dt.tr}>
              <td className={dt.td}>{c.name}</td>
              <td className={dt.td}>{c.email}</td>
              <td className={dt.td}>{c.phone}</td>

              <td className={`${dt.td} flex flex-wrap gap-2`}>
                <button
                  className="px-3 py-1 bg-accent text-white rounded"
                  onClick={() => router.push(`/quotes?contactId=${c.id}&companyId=${c.company_id}`)}
                >
                  {es.con.usarEnCotizacion}
                </button>

                <button
                  className="px-3 py-1 bg-accent hover:bg-accent-strong text-white rounded"
                  onClick={() => onEdit(c)}
                >
                  Editar
                </button>

                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => onDelete(c.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}