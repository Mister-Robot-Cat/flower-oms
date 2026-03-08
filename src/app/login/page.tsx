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
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand shadow-brand-lg mb-4">
            <span className="text-3xl">�</span>
          </div>
          <h1 className="text-3xl font-bold font-display bg-gradient-brand bg-clip-text text-transparent mb-2">
            FlowerOMS
          </h1>
          <p className="text-text-secondary">Sistemə daxil olun</p>
        </div>

        {/* Login Card */}
        <div className="card card-hover p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                İstifadəçi adı
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="İstifadəçi adını daxil edin"
                required
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                Şifrə
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrəni daxil edin"
                required
                className="text-base"
              />
            </div>

            {error && (
              <div className="bg-error-bg border border-error/20 rounded-lg p-3">
                <p className="text-sm text-error text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full font-semibold"
            >
              {loading ? "Daxil olunur..." : "Daxil ol"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-text-muted">
            Təhlükəsiz giriş • Şifrələr şifrələnir
          </p>
        </div>
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
