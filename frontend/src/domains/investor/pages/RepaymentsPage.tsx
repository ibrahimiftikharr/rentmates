import { RepaymentCenter } from "../components/RepaymentCenter";
import { AutoRepaymentWidget } from "../components/AutoRepaymentWidget";
import { RepaymentCalendar } from "../components/RepaymentCalendar";

export function RepaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Repayment & Withdrawal Center</h2>
        <p className="text-sm text-muted-foreground">
          Track repayments, manage withdrawals, and configure auto-payment settings
        </p>
      </div>

      <RepaymentCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RepaymentCenter />
        </div>
        <div>
          <AutoRepaymentWidget />
        </div>
      </div>
    </div>
  );
}