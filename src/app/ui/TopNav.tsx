import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";
import MobileMenu from "@/components/MobileMenu";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", CALL_CENTER: "Operator", FLORIST: "Florist" };

export default async function TopNav() {
  const user = await getCurrentUser();
  const role = user?.role;
  // Signed-out screens (login) carry their own brand; no bar needed.
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={user ? "/dashboard" : "/login"} className="font-display text-lg font-extrabold text-plum">
          flower·oms
        </Link>

        <NavLinks role={role} />

        <div className="flex items-center gap-3">
          <Link href="/profile" title={user.displayName} className="hidden sm:flex items-center gap-2 rounded-full p-1 sm:pr-3 lg:pr-1 2xl:pr-3 hover:bg-fill">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-orchid font-display text-xs font-bold text-white">
              {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                {/* name only where there is room next to the full admin menu */}
            <span className="text-sm font-semibold text-ink lg:hidden 2xl:inline">{user.displayName}</span>
                {role && <span className="text-xs text-ink-muted lg:hidden 2xl:inline">{ROLE_LABEL[role] ?? role}</span>}
          </Link>
          <LogoutButton className="hidden lg:inline-flex" />
          <MobileMenu role={role} name={user.displayName} />
        </div>
      </div>
    </header>
  );
}
