import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { InvestmentConfirmationModal } from "../modals/InvestmentConfirmationModal";
import { WithdrawalModal } from "../modals/WithdrawalModal";
import { DepositModal } from "../modals/DepositModal";
import { InvestmentDetailModal } from "../modals/InvestmentDetailModal";
import { EscrowReleaseModal } from "../modals/EscrowReleaseModal";
import { EmptyState } from "../EmptyState";
import { DashboardSkeleton, InvestmentCardSkeleton, TableSkeleton, ChartSkeleton } from "../LoadingStates";
import { InvestmentTutorial } from "../InvestmentTutorial";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Shield,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  GraduationCap,
  PlaySquare
} from "lucide-react";

export function DemoPage() {
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [showLoadingStates, setShowLoadingStates] = useState(false);

  const showToasts = () => {
    toast.success("Success notification! 🎉", {
      description: "This is a success message"
    });
    
    setTimeout(() => {
      toast.error("Error notification", {
        description: "Something went wrong"
      });
    }, 500);
    
    setTimeout(() => {
      toast.warning("Warning notification", {
        description: "Please check this"
      });
    }, 1000);
    
    setTimeout(() => {
      toast.info("Info notification", {
        description: "Here's some information"
      });
    }, 1500);
    
    setTimeout(() => {
      toast.loading("Processing...", {
        description: "Please wait"
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Demo & Tutorial Center</h2>
        <p className="text-sm text-muted-foreground">
          Learn how to use the dashboard and test all interactive components
        </p>
      </div>

      <Tabs defaultValue="tutorial" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tutorial" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Investment Tutorial
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2">
            <PlaySquare className="h-4 w-4" />
            Component Demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorial" className="space-y-6">
          <InvestmentTutorial />
        </TabsContent>

        <TabsContent value="components" className="space-y-6">{/* Modals Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>🎭 Modals & Dialogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={() => setInvestmentModalOpen(true)}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Investment Modal
            </Button>
            
            <Button
              onClick={() => setWithdrawalModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdrawal Modal
            </Button>
            
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit Modal
            </Button>
            
            <Button
              onClick={() => setDetailModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              Investment Details
            </Button>
            
            <Button
              onClick={() => setEscrowModalOpen(true)}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700"
            >
              <Shield className="mr-2 h-4 w-4" />
              Escrow Release
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>🔔 Toast Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={showToasts} variant="outline" className="w-full md:w-auto">
            Show All Toast Types
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Displays success, error, warning, info, and loading toasts
          </p>
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>📭 Empty States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h4 className="mb-4 text-sm font-semibold">No Investments</h4>
            <div className="border rounded-lg">
              <EmptyState type="investments" onAction={() => toast.info("Navigate to pools")} />
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 text-sm font-semibold">No Transactions</h4>
            <div className="border rounded-lg">
              <EmptyState type="transactions" />
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 text-sm font-semibold">Wallet Not Connected</h4>
            <div className="border rounded-lg">
              <EmptyState type="wallet" onAction={() => toast.info("Connect wallet")} />
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 text-sm font-semibold">Search No Results</h4>
            <div className="border rounded-lg">
              <EmptyState type="search" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>⏳ Loading States (Skeletons)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLoadingStates(!showLoadingStates)}
            >
              {showLoadingStates ? "Hide" : "Show"} Loading States
            </Button>
          </CardTitle>
        </CardHeader>
        {showLoadingStates && (
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-4 text-sm font-semibold">Dashboard Skeleton</h4>
              <DashboardSkeleton />
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-semibold">Investment Card Skeleton</h4>
              <InvestmentCardSkeleton />
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-semibold">Table Skeleton</h4>
              <TableSkeleton rows={3} />
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-semibold">Chart Skeleton</h4>
              <ChartSkeleton />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status Indicators */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>🚦 Status Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Success State</span>
              </div>
              <p className="text-sm text-green-700">
                Transaction completed successfully
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-900">Pending State</span>
              </div>
              <p className="text-sm text-orange-700">
                Transaction is being processed
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">Error State</span>
              </div>
              <p className="text-sm text-red-700">
                Transaction failed, please try again
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Info State</span>
              </div>
              <p className="text-sm text-blue-700">
                Additional information available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InvestmentConfirmationModal
        isOpen={investmentModalOpen}
        onClose={() => setInvestmentModalOpen(false)}
        poolName="Conservative Growth"
        duration={12}
        riskLevel="Low"
        estimatedROI="8-12%"
        maxAmount={10000}
        minAmount={100}
      />

      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        availableBalance={2450}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />

      <InvestmentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        poolName="Conservative Growth"
        riskLevel="Low"
      />

      <EscrowReleaseModal
        isOpen={escrowModalOpen}
        onClose={() => setEscrowModalOpen(false)}
        loanId="LN-2847"
        borrowerAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab"
        collateralAmount={5200}
      />
    </div>
  );
}