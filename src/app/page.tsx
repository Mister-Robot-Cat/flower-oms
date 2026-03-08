import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1F2] to-[#E8D5E8] flex items-center justify-center">
      <main className="mx-auto w-full max-w-3xl rounded-xl bg-space-surface p-10 shadow-xl border border-space-border text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#6E1075] text-white shadow-md mb-4">🌸</div>
        <h1 className="text-3xl font-semibold font-display text-space-text-primary mb-2">COSMIC</h1>
        <p className="text-space-text-secondary mb-6">Daxil olun və sifarişlərlə işləməyə başlayın.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6E1075]/20 disabled:opacity-50 text-sm px-6 py-2.5 bg-[#6E1075] text-white shadow-sm hover:shadow-md">
                Panelə keç
              </button>
            </span>
          </Link>
          <Link href="/login" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C743DA]/20 disabled:opacity-50 text-sm px-6 py-2.5 bg-white text-[#501257] border border-[#C743DA]/30 hover:bg-[#F3F1F2]">
                Daxil ol
              </button>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
