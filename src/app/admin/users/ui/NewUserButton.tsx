"use client";

import { useState } from "react";
import NewUserModal from "./NewUserModal";

export default function NewUserButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-cosmic-purple text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-cosmic-purple-light transition-colors focus:outline-none focus:ring-2 focus:ring-cosmic-purple focus:ring-offset-2"
      >
        ➕ Yeni İstifadəçi
      </button>

      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
