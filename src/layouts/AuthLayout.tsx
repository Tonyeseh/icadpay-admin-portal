import { Outlet } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col p-6 lg:p-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          ICAD Pay Admin · Internal use only · Unauthorised access is prohibited
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.10),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <span className="text-xs font-medium text-primary-foreground/80 uppercase tracking-widest">
              Admin Portal
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-primary-foreground">
              Operate the platform.<br />
              Protect merchants.<br />
              Keep money moving.
            </h1>
            <p className="mt-6 max-w-md text-primary-foreground/80">
              Full-stack operations tooling for ICAD Pay staff — merchant management, fraud monitoring, financial controls, and compliance in one place.
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-4 text-sm">
            <li>
              <div className="text-3xl font-semibold">1,247</div>
              <div className="text-xs text-primary-foreground/70">active merchants</div>
            </li>
            <li>
              <div className="text-3xl font-semibold">94.2%</div>
              <div className="text-xs text-primary-foreground/70">approval rate</div>
            </li>
            <li>
              <div className="text-3xl font-semibold">₦125B+</div>
              <div className="text-xs text-primary-foreground/70">GMV this month</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
