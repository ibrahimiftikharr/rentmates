import { Shield, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

export function SafetyFinancialSection() {
  const scamRiskScore = 15; // Low risk (0-100, lower is better)
  
  const getRiskLevel = (score: number) => {
    if (score <= 20) return { level: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-500', barColor: 'bg-green-500' };
    if (score <= 50) return { level: 'Medium Risk', color: 'text-orange-600', bgColor: 'bg-orange-500', barColor: 'bg-orange-500' };
    return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-500', barColor: 'bg-red-500' };
  };

  const riskInfo = getRiskLevel(scamRiskScore);

  const handleReportListing = () => {
    toast.success('Report submitted successfully. Our team will review it within 24 hours.');
  };

  const handleApplyLoan = () => {
    toast.success('Redirecting to loan application...');
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Safety & Financial Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Scam Risk Score */}
        <div className="bg-muted/30 p-6 rounded-xl border border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="mb-1 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Scam Risk Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis using Natural Language Processing
              </p>
            </div>
            <Badge className={`${riskInfo.bgColor} hover:${riskInfo.bgColor} text-white px-4 py-2`}>
              {riskInfo.level}
            </Badge>
          </div>

          {/* Risk Score Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Score: {scamRiskScore}/100</span>
              <span className={`text-sm font-medium ${riskInfo.color}`}>
                {100 - scamRiskScore}% Safe
              </span>
            </div>
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${riskInfo.barColor} transition-all duration-500`}
                  style={{ width: `${scamRiskScore}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
              <p className="text-sm font-medium text-green-900">✓ Verified Landlord</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
              <p className="text-sm font-medium text-green-900">✓ Clear Description</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
              <p className="text-sm font-medium text-green-900">✓ Realistic Pricing</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
              <p className="text-sm font-medium text-green-900">✓ Valid Contact Info</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report Suspicious Listing */}
          <div className="p-6 rounded-xl border-2 border-red-200 bg-red-50/30 hover:bg-red-50/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Report Suspicious Activity</h4>
                <p className="text-sm text-muted-foreground">
                  Found something suspicious? Help us keep the platform safe.
                </p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleReportListing}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Listing
            </Button>
          </div>

          {/* Apply for Loan */}
          <div className="p-6 rounded-xl border-2 border-green-200 bg-green-50/30 hover:bg-green-50/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Short on Budget?</h4>
                <p className="text-sm text-muted-foreground">
                  Apply for a student loan with flexible repayment options.
                </p>
              </div>
            </div>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleApplyLoan}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Apply for Loan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
