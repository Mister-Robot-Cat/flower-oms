"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  /**
   * Credentials sign-in against next-auth's own endpoints. next-auth's signIn()
   * cannot be used with redirect: false here, because our redirect callback returns
   * relative URLs ("/dashboard") and the client calls new URL() on them.
   */
  async function postCredentials(): Promise<{ url: string; error: string | null; csrfFailed: boolean }> {
    const { csrfToken } = await fetch("/api/auth/csrf", { cache: "no-store" }).then((r) => r.json());
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, username, password, callbackUrl, json: "true" }),
    });
    const data = await res.json().catch(() => ({}));
    const url = new URL(data.url ?? "/login", window.location.origin);
    return { url: url.pathname + url.search + url.hash, error: url.searchParams.get("error"), csrfFailed: url.searchParams.has("csrf") };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result = await postCredentials();
      // On a first visit two requests can hand out different CSRF cookies at once,
      // so a very quick submit fails with ?csrf=true. The second try uses the settled cookie.
      if (result.csrfFailed) result = await postCredentials();

      if (result.error || result.csrfFailed) {
        setLoading(false);
        setError(result.error ? "Yanlış istifadəçi adı və ya şifrə" : "Giriş alınmadı, yenidən cəhd edin");
        return;
      }
      // The URL went through the server-side redirect check (same origin only).
      window.location.assign(result.url);
    } catch {
      setLoading(false);
      setError("Giriş zamanı xəta baş verdi");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-display text-4xl font-extrabold tracking-tight text-plum">flower·oms</p>
        <p className="mt-2 text-ink-soft">Sifarişlər, buketlər və ödənişlər bir yerdə.</p>

        {/* The login form is itself an order tag: orchid ribbon, punched hole. */}
        <form
          onSubmit={handleSubmit}
          className="tag-card mt-8 space-y-5 !py-6 !pr-6"
          style={{ "--st": "var(--color-orchid)" } as React.CSSProperties}
        >
          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-sm font-semibold text-plum-deep">
              İstifadəçi adı
            </label>
            <Input
              id="login-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="İstifadəçi adını daxil edin"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-plum-deep">
              Şifrə
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrəni daxil edin"
              required
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-error-bg px-4 py-3 text-sm font-semibold text-error">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} loading={loading} variant="primary" size="lg" className="w-full">
            {loading ? "Daxil olunur..." : "Daxil ol"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">Şifrəni unutmusunuz? Administratora müraciət edin.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-ink-soft">Yüklənir...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
