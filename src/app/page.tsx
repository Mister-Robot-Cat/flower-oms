import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="mx-auto w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-[#C743DA]/20 p-8 text-center">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6E1075] to-[#631974] shadow-2xl mb-6 ring-4 ring-[#C743DA]/20 backdrop-blur-sm border border-[#C743DA]/30">
            <span className="text-4xl filter drop-shadow-lg">🌸</span>
          </div>
          <h1 className="text-4xl font-display bg-gradient-to-r from-[#6E1075] to-[#631974] bg-clip-text text-transparent mb-3 tracking-tight">
            COSMIC
          </h1>
          <p className="text-[#501257] text-lg font-light tracking-wide mb-8">Premium Sistem</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-[#6E1075] to-[#631974] text-white border border-[#C743DA]/30">
                Panelə keç
              </button>
            </span>
          </Link>
          <Link href="/login" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm text-[#501257] border border-[#C743DA]/40 hover:bg-white">
                Daxil ol
              </button>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
