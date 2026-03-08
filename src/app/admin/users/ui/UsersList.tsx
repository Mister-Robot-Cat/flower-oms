"use client";

import { useState } from "react";
import Badge from "@/app/ui/Badge";
import UserEditModal from "./UserEditModal";

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count: {
    createdOrders: number;
    assignedOrders: number;
    preparedOrders: number;
  };
}

interface UsersListProps {
  users: User[];
}

const roleNames: Record<string, string> = {
  ADMIN: "Administrator",
  CALL_CENTER: "Operator",
  FLORIST: "Florist",
};

const roleColors: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  ADMIN: "danger",
  CALL_CENTER: "warning",
  FLORIST: "success",
};

export default function UsersList({ users: initialUsers }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setIsEditModalOpen(false);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: updatedUser.isActive } : u))
        );
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-space-border">
          <thead className="bg-space-surface-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                İstifadəçi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                Statistika
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                Qeydiyyat
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-space-text-secondary uppercase tracking-wider">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-space-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-space-surface-light transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-space-text-primary">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-space-text-secondary">
                      @{user.username}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={roleColors[user.role]}>
                    {roleNames[user.role] || user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={user.isActive ? "success" : "neutral"}>
                    {user.isActive ? "Aktiv" : "Deaktiv"}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-space-text-secondary">
                  {user.role === "CALL_CENTER" && (
                    <span>Yaradıb: {user._count.createdOrders}</span>
                  )}
                  {user.role === "FLORIST" && (
                    <span>
                      Təyin: {user._count.assignedOrders} / Hazır: {user._count.preparedOrders}
                    </span>
                  )}
                  {user.role === "ADMIN" && (
                    <span>Yaradıb: {user._count.createdOrders}</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-space-text-secondary">
                  {new Date(user.createdAt).toLocaleDateString("az-AZ")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-cosmic-purple hover:text-cosmic-purple-light mr-3 transition-colors"
                  >
                    Redaktə
                  </button>
                  <button
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                    className={`transition-colors ${
                      user.isActive
                        ? "text-cosmic-red hover:text-cosmic-red-light"
                        : "text-cosmic-green hover:text-cosmic-green-light"
                    }`}
                  >
                    {user.isActive ? "Deaktiv et" : "Aktiv et"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-space-text-secondary">
            İstifadəçi tapılmadı
          </div>
        )}
      </div>

      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}
