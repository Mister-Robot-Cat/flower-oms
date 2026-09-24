import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NewFlowerForm from "./ui/NewFlowerForm";
import EditFlowerRow, { EditFlowerCard } from "./ui/EditFlowerRow";

export default async function FlowersAdminPage() {
  await requirePageUser(["ADMIN"], "/admin/flowers");
  const flowers = await prisma.flower.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-cosmic-gradient py-6 sm:py-8 px-3">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-4 sm:p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Çiçəklər (Anbar)</h1>
        <NewFlowerForm />

        {/* Phone: cards */}
        <div className="mt-6 space-y-3 md:hidden">
          {flowers.map((f) => (
            <EditFlowerCard key={f.id} flower={f} />
          ))}
          {flowers.length === 0 && <div className="text-center text-space-text-secondary py-6">Çiçək yoxdur</div>}
        </div>

        {/* Desktop: table */}
        <div className="mt-6 overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm border-t border-space-border">
            <thead className="bg-space-surface-light/40 text-left">
              <tr>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Ad</th>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Vahid</th>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Ehtiyat</th>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Aşağı səviyyə</th>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Aktiv</th>
                <th className="px-3 py-2 text-space-text-secondary text-xs uppercase tracking-wide">Yenilə</th>
              </tr>
            </thead>
            <tbody>
              {flowers.map((f) => (
                <EditFlowerRow key={f.id} flower={f} />
              ))}
              {flowers.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-space-text-secondary" colSpan={6}>
                    Çiçək yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
