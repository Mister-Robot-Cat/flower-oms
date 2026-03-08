"use client";

import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: true,
        callbackUrl: callbackUrl,
        username,
        password,
      });

      setLoading(false);

      // If redirect: true, we shouldn't reach here, but just in case
      if (res?.error) {
        setError("Yanlış istifadəçi adı və ya şifrə");
      }
    } catch (error) {
      setLoading(false);
      setError("Giriş zamanı xəta baş verdi");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cosmic-gradient px-4">
      <div className="w-full max-w-md rounded-xl bg-space-surface p-8 shadow-xl border border-space-border">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-purple-light text-2xl text-white">🌌</div>
          <div className="mb-1 text-2xl font-bold font-display">Cosmic</div>
          <p className="text-sm text-space-text-secondary">Daxil olun</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-space-text-secondary mb-1">
              İstifadəçi adı
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-space-text-secondary mb-1">
              Şifrə
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-cosmic-red mt-1 text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="mt-2 w-full"
          >
            {loading ? "Daxil olunur..." : "Daxil ol"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-cosmic-gradient">
        <div className="text-sm text-space-text-secondary">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
