"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Input from "@/app/ui/Input";
import Badge from "@/app/ui/Badge";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  birthday: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();

      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-space-border shadow-sm">
      <div className="p-4 border-b border-space-border">
        <Input
          type="text"
          placeholder="Ad, telefon və ya email ilə axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-space-surface-light border-b border-space-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Müştəri
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Əlaqə
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Sifarişlər
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Qeydiyyat
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-space-text-secondary uppercase tracking-wider">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-space-text-secondary">
                  Yüklənir...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-space-text-secondary">
                  Müştəri tapılmadı
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-space-surface-light transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-space-text-primary hover:text-brand-primary transition-colors"
                    >
                      {customer.fullName}
                    </Link>
                    {customer.birthday && (
                      <div className="text-xs text-space-text-secondary mt-0.5">
                        🎂 {new Date(customer.birthday).toLocaleDateString("az-AZ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-space-text-primary">{customer.phone}</div>
                    {customer.email && (
                      <div className="text-xs text-space-text-secondary mt-0.5">
                        {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-space-text-primary">
                      {customer._count.orders} sifariş
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={customer.isActive ? "success" : "default"}>
                      {customer.isActive ? "Aktiv" : "Deaktiv"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-space-text-secondary">
                    {new Date(customer.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium transition-colors"
                    >
                      Bax →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
