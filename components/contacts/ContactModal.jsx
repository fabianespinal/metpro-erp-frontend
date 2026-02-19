"use client";

import { useState } from "react";

export default function ContactModal({ contact, onClose, onSubmit }) {
  const [form, setForm] = useState({
    company_id: contact?.company_id || "",
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {contact ? "Edit Contact" : "New Contact"}
        </h2>

        <div className="space-y-4">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(form)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}