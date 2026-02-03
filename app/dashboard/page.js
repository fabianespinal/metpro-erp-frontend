"use client";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <Link href="/quotes" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Quotes</h2>
          <p className="text-gray-600">Create and manage quotes</p>
        </Link>

        <Link href="/products" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-gray-600">Manage your product catalog</p>
        </Link>

        <Link href="/projects" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-gray-600">Track and manage projects</p>
        </Link>

        <Link href="/clients" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-gray-600">Manage client information</p>
        </Link>

        <Link href="/users" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-gray-600">Admin user management</p>
        </Link>

        <Link href="/reports" className="block p-6 border rounded-lg shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-gray-600">View system analytics</p>
        </Link>

      </div>
    </div>
  );
}