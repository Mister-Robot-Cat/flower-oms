import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const userId = (session.user as any).id as string;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          createdOrders: true,
          assignedOrders: true,
          preparedOrders: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const roleNames: Record<string, string> = {
    ADMIN: "Administrator",
    CALL_CENTER: "Zəng mərkəzi operatoru",
    FLORIST: "Florist",
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-space-surface p-8 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-6 font-display text-space-text-primary">Profil</h1>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="rounded-lg bg-space-surface-light border border-space-border p-6">
            <h2 className="text-lg font-semibold text-space-text-primary mb-4">Şəxsi məlumatlar</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-space-text-secondary">İstifadəçi adı:</span>
                <span className="text-sm font-medium text-space-text-primary">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-space-text-secondary">Ad:</span>
                <span className="text-sm font-medium text-space-text-primary">{user.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-space-text-secondary">Rol:</span>
                <span className="inline-flex rounded-full border border-cosmic-purple-light/30 bg-cosmic-purple/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-cosmic-purple-light">
                  {roleNames[user.role] || user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-space-text-secondary">Status:</span>
                <span className={`text-sm font-medium ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                  {user.isActive ? "Aktiv" : "Deaktiv"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-space-text-secondary">Qeydiyyat tarixi:</span>
                <span className="text-sm font-medium text-space-text-primary">
                  {user.createdAt.toLocaleDateString("az-AZ")}
                </span>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="rounded-lg bg-space-surface-light border border-space-border p-6">
            <h2 className="text-lg font-semibold text-space-text-primary mb-4">Statistika</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.role === "CALL_CENTER" && (
                <div className="rounded-lg bg-space-surface border border-space-border p-4 text-center">
                  <div className="text-2xl font-bold text-cosmic-purple-light">{user._count.createdOrders}</div>
                  <div className="text-xs text-space-text-secondary mt-1">Yaradılmış sifarişlər</div>
                </div>
              )}
              {user.role === "FLORIST" && (
                <>
                  <div className="rounded-lg bg-space-surface border border-space-border p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{user._count.assignedOrders}</div>
                    <div className="text-xs text-space-text-secondary mt-1">Təyin edilmiş</div>
                  </div>
                  <div className="rounded-lg bg-space-surface border border-space-border p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{user._count.preparedOrders}</div>
                    <div className="text-xs text-space-text-secondary mt-1">Hazırlanmış</div>
                  </div>
                </>
              )}
              {user.role === "ADMIN" && (
                <div className="rounded-lg bg-space-surface border border-space-border p-4 text-center">
                  <div className="text-2xl font-bold text-cosmic-purple-light">{user._count.createdOrders}</div>
                  <div className="text-xs text-space-text-secondary mt-1">Yaradılmış sifarişlər</div>
                </div>
              )}
            </div>
          </div>

          {/* Действия */}
          <div className="flex gap-3">
            <button className="flex-1 rounded-lg border border-space-border bg-space-surface-light px-4 py-2 text-sm font-medium text-space-text-primary transition-colors hover:bg-space-surface-light/70">
              Şifrəni dəyişdir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
