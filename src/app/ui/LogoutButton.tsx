"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
      className={`rounded-full border-[1.5px] border-line px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-error hover:text-error ${className}`}
    >
      Çıxış
    </button>
  );
}
