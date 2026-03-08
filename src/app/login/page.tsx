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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6E1075] shadow-lg mb-4">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-3xl font-display text-[#501257] mb-3 font-semibold">
            COSMIC
          </h1>
          <p className="text-[#501257] text-lg font-light tracking-wide">Premium Sistem</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#C743DA]/20 p-8 hover:shadow-3xl transition-all duration-500">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-display text-[#501257] mb-2 font-light">Xoş gəlmisiniz</h2>
            <p className="text-[#631974] text-lg font-light">Hesabınıza daxil olun</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#501257] uppercase tracking-wider">
                İstifadəçi adı
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="İstifadəçi adını daxil edin"
                required
                className="bg-white/5 border-[#C743DA]/30 text-[#501257] placeholder-[#631974]/50"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#501257] uppercase tracking-wider">
                Şifrə
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrəni daxil edin"
                required
                className="bg-white/5 border-[#C743DA]/30 text-[#501257] placeholder-[#631974]/50"
              />
            </div>

            {error && (
              <div className="bg-[#6E1075]/10 border border-[#6E1075]/30 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-[#6E1075] text-center flex items-center justify-center gap-2">
                  <span className="text-lg">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full font-semibold text-lg shadow-xl hover:shadow-2xl"
            >
              {loading ? "Daxil olunur..." : "Daxil ol"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#631974] font-light flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#C743DA] rounded-full animate-pulse"></span>
            Təhlükəsiz SSL • Şifrələr qorunur
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[#631974] font-medium animate-pulse">Yüklənir...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
