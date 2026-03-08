import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center">
      <main className="mx-auto w-full max-w-3xl rounded-xl bg-space-surface p-10 shadow-xl border border-space-border text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-glow text-white shadow-glow-purple mb-4">🌸</div>
        <h1 className="text-3xl font-semibold font-display text-space-text-primary mb-2">Cosmic Flower OMS</h1>
        <p className="text-space-text-secondary mb-6">Daxil olun və sifarişlərlə işləməyə başlayın.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cosmic-purple-light/40 disabled:opacity-60 text-sm px-4 py-2 bg-purple-glow text-white shadow-glow-purple hover:-translate-y-0.5">
                Panelə keç
              </button>
            </span>
          </Link>
          <Link href="/login" className="inline-flex">
            <span className="inline-flex">
              <button className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cosmic-purple-light/40 disabled:opacity-60 text-sm px-4 py-2 bg-space-surface text-space-text-primary border border-space-border hover:bg-space-surface-light">
                Daxil ol
              </button>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
