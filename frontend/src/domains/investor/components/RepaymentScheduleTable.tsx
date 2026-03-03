import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { getPoolRepaymentSchedule } from "@/shared/services/investorPortfolioService";
import { toast } from "sonner";

interface RepaymentScheduleProps {
  poolId: string;
}

interface LoanSchedule {
  loanId: string;
  borrowerName: string;
  loanAmount: number;
  investorShare: number;
  sharePercentage: string;
  paymentsCompleted: number;
  totalInstallments: number;
  status: string;
  schedule: Array<{
    installmentNumber: number;
    dueDate: string;
    totalAmount: number;
    investorPortion: number;
    principalAmount: number;
    interestAmount: number;
    investorPrincipal: number;
    investorInterest: number;
    status: string;
    paidAt?: string;
  }>;
}

export function RepaymentScheduleTable({ poolId }: RepaymentScheduleProps) {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  useEffect(() => {
    loadScheduleData();
  }, [poolId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const data = await getPoolRepaymentSchedule(poolId);
      setScheduleData(data);
    } catch (error: any) {
      console.error('Load schedule error:', error);
      toast.error(error.error || 'Failed to load repayment schedule');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Paid' },
      pending: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Pending' },
      overdue: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Overdue' },
      defaulted: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Defaulted' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scheduleData || scheduleData.activeLoans === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-muted-foreground">No active loans in this pool yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pool Investment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Your Investment Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600 mb-1">Your Investment</p>
            <p className="font-bold text-blue-900">${scheduleData.amountInvested.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-600 mb-1">Your Share</p>
            <p className="font-bold text-blue-900">{scheduleData.investorSharePercentage}%</p>
          </div>
          <div>
            <p className="text-blue-600 mb-1">Total Pool</p>
            <p className="font-bold text-blue-900">${scheduleData.totalPoolInvestment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-600 mb-1">Active Loans</p>
            <p className="font-bold text-blue-900">{scheduleData.activeLoans}</p>
          </div>
        </div>
      </div>

      {/* Loan Schedules */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Loan Repayment Schedule</h4>
        
        {scheduleData.loanSchedules.map((loan: LoanSchedule) => (
          <div key={loan.loanId} className="border rounded-lg overflow-hidden">
            {/* Loan Header */}
            <div 
              className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedLoan(expandedLoan === loan.loanId ? null : loan.loanId)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{loan.borrowerName}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Loan: ${loan.loanAmount.toLocaleString()} | Your Share: ${loan.investorShare.toFixed(2)} ({loan.sharePercentage}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">{loan.paymentsCompleted}/{loan.totalInstallments} Paid</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((loan.paymentsCompleted / loan.totalInstallments) * 100)}% Complete
                  </p>
                </div>
                <svg 
                  className={`w-5 h-5 transition-transform ${expandedLoan === loan.loanId ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Schedule Table */}
            {expandedLoan === loan.loanId && (
              <div className="p-4 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-left py-2 px-2">Due Date</th>
                        <th className="text-right py-2 px-2">Total Amount</th>
                        <th className="text-right py-2 px-2">Your Portion</th>
                        <th className="text-right py-2 px-2">Principal</th>
                        <th className="text-right py-2 px-2">Interest</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loan.schedule.map((installment) => (
                        <tr 
                          key={installment.installmentNumber}
                          className={`border-b border-gray-100 ${
                            installment.status === 'paid' ? 'bg-green-50' : ''
                          }`}
                        >
                          <td className="py-3 px-2 font-medium">{installment.installmentNumber}</td>
                          <td className="py-3 px-2">
                            {new Date(installment.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-2 text-right">${installment.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right font-semibold text-primary">
                            ${installment.investorPortion.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right text-blue-600">
                            ${installment.investorPrincipal.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right text-green-600">
                            ${installment.investorInterest.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {getStatusBadge(installment.status)}
                            {installment.paidAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(installment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
