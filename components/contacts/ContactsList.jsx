import ContactCard from "./ContactCard";

export default function ContactsList({ contacts, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onEdit={() => onEdit(contact)}
          onDelete={() => onDelete(contact.id)}
        />
      ))}
    </div>
  );
}