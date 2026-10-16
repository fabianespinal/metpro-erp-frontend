import { useState } from "react";

// Mounted fresh on each open (parent renders it only while modalOpen),
// so the form is initialised once from the contact being edited.
export default function ContactModal({ contact, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
  }));

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-surface p-6 rounded shadow-card w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {contact ? "Editar Contacto" : "Añadir Contacto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre"
            className="w-full border p-2 rounded"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border p-2 rounded"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-line rounded"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}