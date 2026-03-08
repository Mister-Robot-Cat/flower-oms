"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/orders?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/orders");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Müştəri adı və ya telefon..."
        className="flex-1 rounded-lg border border-space-border bg-space-surface-light px-4 py-2 text-sm text-space-text-primary placeholder:text-space-text-secondary focus:border-cosmic-purple-light focus:outline-none focus:ring-2 focus:ring-cosmic-purple-light/20"
      />
      <button
        type="submit"
        className="rounded-lg bg-cosmic-purple px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cosmic-purple/30 transition-all hover:-translate-y-0.5 hover:bg-cosmic-purple-light"
      >
        🔍 Axtar
      </button>
    </form>
  );
}
