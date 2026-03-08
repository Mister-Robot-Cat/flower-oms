"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  function handleLogout() {
    signOut({ 
      callbackUrl: "/login",
      redirect: true 
    });
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border-2 border-red-500/30 bg-transparent px-4 py-1.5 text-red-400 transition-colors hover:border-red-500 hover:bg-red-500/10"
    >
      Çıxış
    </button>
  );
}
