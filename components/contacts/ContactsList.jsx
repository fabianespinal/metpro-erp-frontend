import { useRouter } from "next/navigation";

export default function ContactsList({ contacts, onEdit, onDelete }) {
  const router = useRouter();

  if (!contacts || contacts.length === 0) {
    return <p className="text-gray-500">No hay contactos registrados.</p>;
  }

  return (
    <div className="bg-white shadow rounded-md overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Nombre</th>
            <th className="p-3">Email</th>
            <th className="p-3">Teléfono</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.email}</td>
              <td className="p-3">{c.phone}</td>

              <td className="p-3 flex gap-2 flex-wrap">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => router.push(`/quotes?contactId=${c.id}&companyId=${c.company_id}`)}
                >
                  Use in Quote
                </button>

                <button
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
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