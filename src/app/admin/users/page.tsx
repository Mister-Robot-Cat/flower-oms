import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import UsersList from "./ui/UsersList";
import NewUserButton from "./ui/NewUserButton";

export default async function UsersManagementPage() {
  await requirePageUser(["ADMIN"], "/admin/users");
  const users = await prisma.user.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    operators: users.filter((u) => u.role === "CALL_CENTER").length,
    florists: users.filter((u) => u.role === "FLORIST").length,
  };

  return (
    <div className="min-h-screen bg-space-bg-base py-4 md:py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-space-text-primary font-display">
                İstifadəçi İdarəetməsi
              </h1>
              <p className="text-sm text-space-text-secondary mt-1">
                Sistemdəki bütün istifadəçiləri idarə edin
              </p>
            </div>
            <NewUserButton />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg bg-white border border-space-border p-4 shadow-sm">
              <div className="font-display text-2xl font-bold text-plum-deep">{stats.total}</div>
              <div className="text-xs text-space-text-secondary mt-1">Ümumi</div>
            </div>
            <div className="rounded-lg bg-white border border-space-border p-4 shadow-sm">
              <div className="font-display text-2xl font-bold text-plum-deep">{stats.active}</div>
              <div className="text-xs text-space-text-secondary mt-1">Aktiv</div>
            </div>
            <div className="rounded-lg bg-white border border-space-border p-4 shadow-sm">
              <div className="font-display text-2xl font-bold text-plum-deep">{stats.admins}</div>
              <div className="text-xs text-space-text-secondary mt-1">Admin</div>
            </div>
            <div className="rounded-lg bg-white border border-space-border p-4 shadow-sm">
              <div className="font-display text-2xl font-bold text-plum-deep">{stats.operators}</div>
              <div className="text-xs text-space-text-secondary mt-1">Operator</div>
            </div>
            <div className="rounded-lg bg-white border border-space-border p-4 shadow-sm">
              <div className="font-display text-2xl font-bold text-plum-deep">{stats.florists}</div>
              <div className="text-xs text-space-text-secondary mt-1">Florist</div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="rounded-lg bg-white border border-space-border shadow-sm">
          <UsersList users={users} />
        </div>
      </div>
    </div>
  );
}
