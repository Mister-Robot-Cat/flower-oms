import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-md rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-[#C743DA]/20 p-6 sm:p-8 text-center">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#6E1075] to-[#631974] shadow-2xl mb-4 sm:mb-6 ring-4 ring-[#C743DA]/20 backdrop-blur-sm border border-[#C743DA]/30">
            <span className="text-4xl sm:text-5xl filter drop-shadow-lg">🌸</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display bg-gradient-to-r from-[#6E1075] to-[#631974] bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight">
            COSMIC
          </h1>
          <p className="text-[#501257] text-lg sm:text-xl font-light tracking-wide mb-6 sm:mb-8">Premium Sistem</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl font-semibold text-base sm:text-lg px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-[#6E1075] to-[#631974] text-white border border-[#C743DA]/30">
              Panelə keç
            </button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl font-semibold text-base sm:text-lg px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm text-[#501257] border border-[#C743DA]/40 hover:bg-white">
              Daxil ol
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
