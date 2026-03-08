"use client";

import { useState } from "react";
import Button from "@/app/ui/Button";
import NewCustomerModal from "./NewCustomerModal";

export default function NewCustomerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="primary">
        ➕ Yeni müştəri
      </Button>
      <NewCustomerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
