import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import MobileMenu from "@/components/MobileMenu";

export default async function TopNav() {
  const user = await getCurrentUser();
  const role = user?.role;
  const name = user?.displayName ?? "";
  const roleLabel: Record<string, string> = { ADMIN: "Admin", CALL_CENTER: "Operator", FLORIST: "Florist" };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-[#C743DA]/30 shadow-lg">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
        <Link href={user ? "/dashboard" : "/login"} className="flex items-center gap-2 sm:gap-3 text-sm font-medium text-[#501257] hover:opacity-90 transition-all duration-300 group flex-shrink-0">
          <div className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#6E1075] shadow-md text-lg sm:text-xl">
            🌸
          </div>
          <span className="font-display text-base sm:text-xl font-medium text-[#501257] hidden xs:inline">COSMIC</span>
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
        
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <Link href="/profile" className="text-[#631974] hover:text-[#501257] transition-colors font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                  {name}
                </Link>
                {role && (
                  <span className="inline-flex rounded-lg border border-[#C743DA]/30 bg-[#F3F1F2] px-2 sm:px-3 py-1 text-xs font-medium text-[#501257]">
                    {roleLabel[role] ?? role}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
              <MobileMenu role={role} isAuthenticated={!!user} />
            </>
          ) : (
            <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#6E1075] text-white font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200">Daxil ol</Link>
          )}
        </div>
      </div>
    </header>
  );
}
