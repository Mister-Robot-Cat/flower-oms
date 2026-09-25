"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navItems } from "./nav-items";

export default function NavLinks({ role }: { role?: string }) {
  const pathname = usePathname();
  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label="Əsas menyu">
      {navItems(role).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              active ? "bg-plum text-white" : "text-ink-soft hover:bg-fill hover:text-plum-deep"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
