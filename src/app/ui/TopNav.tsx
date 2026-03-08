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
    <header className="sticky top-0 z-30 glass border-b border-border shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        <Link href={session?.user ? "/dashboard" : "/login"} className="flex items-center gap-3 text-sm font-semibold text-text-primary hover:opacity-80 transition-opacity group">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-brand text-xl group-hover:scale-105 transition-transform">
            🌸
          </div>
          <span className="font-display text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">FlowerOMS</span>
        </Link>
        
        <nav className="hidden gap-1 md:flex text-sm font-medium">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="nav-link">Sifarişlər</Link>
          )}
          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="nav-link">Zəng mərkəzi</Link>
          )}
          {role === "FLORIST" && (
            <Link href="/florist" className="nav-link">Florist</Link>
          )}
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="nav-link">Müştərilər</Link>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="nav-link">İstifadəçilər</Link>
              <Link href="/admin/flowers" className="nav-link">Anbar</Link>
              <Link href="/admin/reports/performance" className="nav-link">Performans</Link>
              <Link href="/admin/reports/sales" className="nav-link">Satışlar</Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/profile" className="text-text-secondary hover:text-text-primary transition-colors font-medium">
                  {name}
                </Link>
                {role && (
                  <span className="inline-flex rounded-lg border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                    {role}
                  </span>
                )}
              </div>
              <LogoutButton />
              <MobileMenu role={role} isAuthenticated={!!session?.user} />
            </>
          ) : (
            <Link href="/login" className="btn-primary">Daxil ol</Link>
          )}
        </div>
      </div>
    </header>
  );
}
