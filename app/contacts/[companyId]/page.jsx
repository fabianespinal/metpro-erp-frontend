"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import ContactsList from "../../../components/contacts/ContactsList";
import ContactModal from "../../../components/contacts/ContactModal";

export default function ContactsPage() {
  const { companyId } = useParams();
  const { contactsQuery, createMutation, updateMutation, deleteMutation } =
    useContacts(companyId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  if (contactsQuery.isLoading) return <div>Loading contacts...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <button
          onClick={() => {
            setEditingContact(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Add Contact
        </button>
      </div>

      <ContactsList
        contacts={contactsQuery.data}
        onEdit={(contact) => {
          setEditingContact(contact);
          setModalOpen(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={() => setModalOpen(false)}
          onSubmit={(data) => {
            if (editingContact) {
              updateMutation.mutate({ id: editingContact.id, data });
            } else {
              createMutation.mutate(data);
            }
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}