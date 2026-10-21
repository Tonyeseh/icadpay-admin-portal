import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminStore } from "@/store/useAdminStore";
import { adminLogin, formatAuthError } from "@/lib/admin-auth-api";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const setSessionFromAuthResponse = useAdminStore((s) => s.setSessionFromAuthResponse);
  const bootstrapSession = useAdminStore((s) => s.bootstrapSession);
  const sessionUser = useAdminStore((s) => s.user);
  const sessionToken = useAdminStore((s) => s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionToken && sessionUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [sessionToken, sessionUser, navigate]);

  useEffect(() => {
    if (sessionToken && sessionUser) return;

    let cancelled = false;
    (async () => {
      const ok = await bootstrapSession();
      if (cancelled) return;
      if (ok && useAdminStore.getState().user) {
        navigate("/dashboard", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapSession, navigate, sessionToken, sessionUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const epoch = useAdminStore.getState().sessionEpoch;
      const data = await adminLogin(email.trim(), password);
      setSessionFromAuthResponse(data, epoch);
      const name = `${data.user.firstName} ${data.user.lastName}`.trim();
      toast.success(name ? `Welcome back, ${data.user.firstName}` : "Signed in");
      navigate("/dashboard");
    } catch (err: unknown) {
      const body =
        err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : undefined;
      toast.error(formatAuthError(body));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheckIcon className="size-3.5" />
          Admin Portal
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authorised ICAD Pay staff only.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
