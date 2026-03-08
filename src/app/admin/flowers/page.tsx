import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewFlowerForm from "./ui/NewFlowerForm";
import EditFlowerRow from "./ui/EditFlowerRow";

export default async function FlowersAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/flowers");
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") redirect("/dashboard");

  const flowers = await prisma.flower.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Çiçəklər (Anbar)</h1>
        <NewFlowerForm />

        <div className="mt-6 overflow-x-auto">
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
