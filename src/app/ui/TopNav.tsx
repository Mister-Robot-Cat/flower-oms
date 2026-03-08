import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import MobileMenu from "@/components/MobileMenu";

export default async function TopNav() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const name = (session?.user as any)?.displayName || (session?.user as any)?.name || "";

  return (
    <header className="sticky top-0 z-30 border-b border-space-border bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        <Link href={session?.user ? "/dashboard" : "/login"} className="flex items-center gap-2.5 text-sm font-semibold text-space-text-primary hover:opacity-80 transition-opacity">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-purple-600 text-white shadow-sm text-lg">🌸</span>
          <span className="font-display text-xl font-bold bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text text-transparent">FlowerOMS</span>
        </Link>
        <nav className="hidden gap-1 md:flex text-sm font-medium">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Sifarişlər</Link>
          )}
          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Zəng mərkəzi</Link>
          )}
          {role === "FLORIST" && (
            <Link href="/florist" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Florist</Link>
          )}
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Müştərilər</Link>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">İstifadəçilər</Link>
              <Link href="/admin/flowers" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Anbar</Link>
              <Link href="/admin/reports/performance" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Performans</Link>
              <Link href="/admin/reports/sales" className="px-3 py-2 rounded-lg text-space-text-secondary transition-colors hover:text-space-text-primary hover:bg-space-surface-light">Satışlar</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/profile" className="text-space-text-secondary hover:text-space-text-primary transition-colors font-medium">
                  {name}
                </Link>
                {role && <span className="inline-flex rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-1 text-xs font-semibold text-brand-primary">{role}</span>}
              </div>
              <LogoutButton />
              <MobileMenu role={role} isAuthenticated={!!session?.user} />
            </>
          ) : (
            <Link href="/login" className="rounded-lg border border-brand-primary bg-brand-primary px-4 py-2 text-white font-medium transition-all hover:bg-brand-primary-hover shadow-sm">Daxil ol</Link>
          )}
        </div>
      </div>
    </header>
  );
}
