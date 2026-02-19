"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ContactsList from "../../../components/contacts/ContactsList";
import ContactModal from "../../../components/contacts/ContactModal";

export default function ContactsPage() {
  const { companyId } = useParams();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.get(`/contacts/company/${companyId}`);
        setContacts(res.data);
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [companyId]);

  async function handleCreate(data) {
    const res = await api.post("/contacts/", {
      ...data,
      company_id: Number(companyId),
    });
    setContacts([...contacts, res.data]);
  }

  async function handleUpdate(id, data) {
    const res = await api.put(`/contacts/${id}`, data);
    setContacts(contacts.map((c) => (c.id === id ? res.data : c)));
  }

  async function handleDelete(id) {
    await api.delete(`/contacts/${id}`);
    setContacts(contacts.filter((c) => c.id !== id));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Contactos</h1>

        <button
          onClick={() => {
            setEditingContact(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Añadir Contacto
        </button>
      </div>

      {loading ? (
        <div>Cargando contactos...</div>
      ) : (
        <ContactsList
          contacts={contacts}
          onEdit={(contact) => {
            setEditingContact(contact);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={() => setModalOpen(false)}
          onSubmit={(data) => {
            if (editingContact) {
              handleUpdate(editingContact.id, data);
            } else {
              handleCreate(data);
            }
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}