"use client";

import { useState } from "react";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

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

interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    role: user.role,
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!formData.displayName) {
      setError("Ad tələb olunur");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError("Şifrə ən azı 8 simvol olmalıdır");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: { displayName: string; role: string; password?: string } = {
        displayName: formData.displayName,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Xəta baş verdi");
        setIsSubmitting(false);
        return;
      }

      // Успех
      onUserUpdated({ ...user, ...data });
      onClose();
    } catch {
      setError("Xəta baş verdi");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        displayName: user.displayName,
        role: user.role,
        password: "",
        confirmPassword: "",
      });
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white border border-space-border shadow-lg">
        <div className="border-b border-space-border px-6 py-4">
          <h3 className="text-lg font-semibold text-space-text-primary">
            İstifadəçini Redaktə Et
          </h3>
          <p className="text-sm text-space-text-secondary mt-1">
            @{user.username}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-space-text-primary mb-1">
              Tam ad *
            </label>
            <Input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-space-text-primary mb-1">
              Rol *
            </label>
            <Select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              disabled={isSubmitting}
              required
            >
              <option value="CALL_CENTER">Operator (Zəng mərkəzi)</option>
              <option value="FLORIST">Florist</option>
              <option value="ADMIN">Administrator</option>
            </Select>
          </div>

          <div className="border-t border-space-border pt-4">
            <p className="text-sm text-space-text-secondary mb-3">
              Şifrəni dəyişmək istəyirsinizsə, aşağıdakı sahələri doldurun
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-space-text-primary mb-1">
                  Yeni şifrə
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-space-text-primary mb-1">
                  Şifrəni təsdiq et
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Ləğv et
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Yadda saxlanır..." : "Yadda saxla"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
