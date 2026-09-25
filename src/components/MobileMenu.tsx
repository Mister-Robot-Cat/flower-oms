"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navItems } from "@/app/ui/nav-items";
import LogoutButton from "@/app/ui/LogoutButton";

export default function MobileMenu({ role, name }: { role?: string; name: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = [{ href: "/dashboard", label: "Panel" }, ...navItems(role), { href: "/profile", label: "Profil" }];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Menyunu bağla" : "Menyunu aç"}
        className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-line bg-surface"
      >
        <span className="relative block h-3.5 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-plum-deep transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-plum-deep transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-3 h-0.5 w-5 rounded bg-plum-deep transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </span>
      </button>

      {open && <div className="fixed inset-0 top-16 z-40 bg-plum-deep/30" onClick={() => setOpen(false)} />}

      {/* invisible (not only off-screen) when closed, so it never widens the page */}
      <div
        id="mobile-menu"
        className={`fixed right-0 top-16 bottom-0 z-50 w-72 max-w-[85vw] border-l border-line bg-paper p-4 transition-transform duration-200 ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="mb-3 px-3 text-sm text-ink-muted">{name}</div>
        <nav className="flex flex-col gap-1" aria-label="Menyu">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-3 py-3 text-base font-semibold ${
                  active ? "bg-plum text-white" : "text-ink hover:bg-fill"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton className="mt-4 w-full py-3" />
      </div>
    </div>
  );
}
