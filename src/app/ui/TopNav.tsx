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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-[#C743DA]/20 shadow-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        <Link href={session?.user ? "/dashboard" : "/login"} className="flex items-center gap-3 text-sm font-medium text-[#501257] hover:opacity-90 transition-all duration-300 group">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#6E1075] shadow-md text-xl">
            🌸
          </div>
          <span className="font-display text-xl font-medium text-[#501257]">COSMIC</span>
        </Link>
        
        <nav className="hidden gap-2 md:flex text-sm font-medium">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Sifarişlər</Link>
          )}
          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Zəng mərkəzi</Link>
          )}
          {role === "FLORIST" && (
            <Link href="/florist" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Florist</Link>
          )}
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Müştərilər</Link>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">İstifadəçilər</Link>
              <Link href="/admin/flowers" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Anbar</Link>
              <Link href="/admin/reports/performance" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Performans</Link>
              <Link href="/admin/reports/sales" className="px-4 py-2.5 rounded-xl text-[#631974] hover:text-[#501257] hover:bg-[#F3F1F2] transition-all duration-300 border border-transparent hover:border-[#C743DA]/30">Satışlar</Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/profile" className="text-[#631974] hover:text-[#501257] transition-colors font-medium">
                  {name}
                </Link>
                {role && (
                  <span className="inline-flex rounded-lg border border-[#C743DA]/30 bg-[#F3F1F2] px-3 py-1 text-xs font-medium text-[#501257]">
                    {role}
                  </span>
                )}
              </div>
              <LogoutButton />
              <MobileMenu role={role} isAuthenticated={!!session?.user} />
            </>
          ) : (
            <Link href="/login" className="px-6 py-2.5 rounded-xl bg-[#6E1075] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200">Daxil ol</Link>
          )}
        </div>
      </div>
    </header>
  );
}
