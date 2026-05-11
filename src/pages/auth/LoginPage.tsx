import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminStore } from "@/store/useAdminStore";
import { MOCK_ADMIN_USERS } from "@/mock/compliance";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("kola@icadpay.com");
  const [password, setPassword] = useState("demo1234");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const signIn = useAdminStore((s) => s.signIn);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = MOCK_ADMIN_USERS.find((u) => u.email === email);
      if (user) {
        signIn(user);
        toast.success(`Welcome back, ${user.firstName}`);
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials");
      }
      setLoading(false);
    }, 700);
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

      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Demo accounts</p>
        <div className="space-y-1">
          {[
            { email: "kola@icadpay.com", role: "Super Admin" },
            { email: "amaka@icadpay.com", role: "Ops & Support" },
            { email: "ngozi@icadpay.com", role: "Risk & Compliance" },
            { email: "ife@icadpay.com", role: "Finance & Settlements" },
            { email: "funke@icadpay.com", role: "Auditor" },
          ].map(({ email: e, role }) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmail(e)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-accent"
            >
              <span className="font-mono text-muted-foreground">{e}</span>
              <span className="text-muted-foreground">{role}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Password: <span className="font-mono">demo1234</span></p>
      </div>
    </div>
  );
}
