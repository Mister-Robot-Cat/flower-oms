"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    role: "CALL_CENTER",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!formData.username || !formData.displayName || !formData.password) {
      setError("Bütün sahələr tələb olunur");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }

    if (formData.password.length < 6) {
      setError("Şifrə ən azı 6 simvol olmalıdır");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Xəta baş verdi");
        setIsSubmitting(false);
        return;
      }

      // Успех
      setFormData({
        username: "",
        displayName: "",
        password: "",
        confirmPassword: "",
        role: "CALL_CENTER",
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError("Xəta baş verdi");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        username: "",
        displayName: "",
        password: "",
        confirmPassword: "",
        role: "CALL_CENTER",
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
            Yeni İstifadəçi Yarat
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-space-text-primary mb-1">
              İstifadəçi adı *
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="operator3"
              disabled={isSubmitting}
              required
            />
          </div>

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
              placeholder="Ayşə Məmmədova"
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

          <div>
            <label className="block text-sm font-medium text-space-text-primary mb-1">
              Şifrə *
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-space-text-primary mb-1">
              Şifrəni təsdiq et *
            </label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              disabled={isSubmitting}
              required
            />
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
              {isSubmitting ? "Yaradılır..." : "Yarat"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
