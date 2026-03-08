"use client";

import { useState } from "react";
import Button from "@/app/ui/Button";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  birthday: Date | null;
  notes: string | null;
  isActive: boolean;
}

export default function CustomerEditButton({ customer }: { customer: Customer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary">
        ✏️ Redaktə et
      </Button>
      {/* Modal будет добавлен позже */}
    </>
  );
}
