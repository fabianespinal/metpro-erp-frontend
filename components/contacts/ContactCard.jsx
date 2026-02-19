export default function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-900">{contact.name}</h2>

      <div className="text-sm text-gray-600 mt-2 space-y-1">
        {contact.email && <p>Email: {contact.email}</p>}
        {contact.phone && <p>Phone: {contact.phone}</p>}
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}