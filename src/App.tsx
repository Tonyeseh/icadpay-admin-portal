import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAccess } from "@/components/auth/RequireAccess";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Merchants
import { MerchantsPage } from "@/pages/merchants/MerchantsPage";
import { MerchantDetailPage } from "@/pages/merchants/MerchantDetailPage";
import { KycQueuePage } from "@/pages/merchants/KycQueuePage";

// Transactions
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";
import { DisputesPage } from "@/pages/transactions/DisputesPage";

// Fraud
import { FraudAlertsPage } from "@/pages/fraud/FraudAlertsPage";
import { RulesEnginePage } from "@/pages/fraud/RulesEnginePage";
import { AmlQueuePage } from "@/pages/fraud/AmlQueuePage";

// Financial
import { LedgerPage } from "@/pages/financial/LedgerPage";
import { AdminPayoutsPage } from "@/pages/financial/AdminPayoutsPage";
import { ReconciliationPage } from "@/pages/financial/ReconciliationPage";

// Platform
import { RoutingRulesPage } from "@/pages/platform/RoutingRulesPage";
import { FxRatesPage } from "@/pages/platform/FxRatesPage";
import { WebhooksPage } from "@/pages/platform/WebhooksPage";
import { ChangeLogPage } from "@/pages/platform/ChangeLogPage";

// Compliance
import { AdminUsersPage } from "@/pages/compliance/AdminUsersPage";
import { AuditLogPage } from "@/pages/compliance/AuditLogPage";

// Analytics
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Merchants */}
              <Route path="/merchants" element={<MerchantsPage />} />
              <Route path="/merchants/kyc-queue" element={<KycQueuePage />} />
              <Route path="/merchants/:id" element={<MerchantDetailPage />} />

              {/* Transactions */}
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/disputes" element={<DisputesPage />} />

              {/* Fraud & Risk — super_admin, risk_compliance, auditor */}
              <Route element={<RequireAccess />}>
                <Route path="/fraud/alerts" element={<FraudAlertsPage />} />
                <Route path="/fraud/rules" element={<RulesEnginePage />} />
                <Route path="/fraud/aml" element={<AmlQueuePage />} />
              </Route>

              {/* Financial Ops — super_admin, finance_settlements, auditor */}
              <Route element={<RequireAccess />}>
                <Route path="/financial/ledger" element={<LedgerPage />} />
                <Route path="/financial/payouts" element={<AdminPayoutsPage />} />
                <Route path="/financial/reconciliation" element={<ReconciliationPage />} />
              </Route>

              {/* Platform Config — super_admin, auditor */}
              <Route element={<RequireAccess />}>
                <Route path="/platform/routing" element={<RoutingRulesPage />} />
                <Route path="/platform/fx-rates" element={<FxRatesPage />} />
                <Route path="/platform/webhooks" element={<WebhooksPage />} />
                <Route path="/platform/change-log" element={<ChangeLogPage />} />
              </Route>

              {/* Compliance — super_admin only for /users; audit-log: super_admin, risk_compliance, auditor */}
              <Route element={<RequireAccess />}>
                <Route path="/compliance/users" element={<AdminUsersPage />} />
                <Route path="/compliance/audit-log" element={<AuditLogPage />} />
              </Route>

              {/* Analytics */}
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}

export default App;
