import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { TrendingUp, ExternalLink, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface InvestmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolName: string;
  riskLevel: "Low" | "Medium" | "High";
}

export function InvestmentDetailModal({
  isOpen,
  onClose,
  poolName,
  riskLevel
}: InvestmentDetailModalProps) {
  const investmentData = {
    amountInvested: 5000,
    currentValue: 5625,
    roiPercentage: 12.5,
    daysRemaining: 180
  };

  const performanceData = [
    { month: "Jan", value: 5000 },
    { month: "Feb", value: 5100 },
    { month: "Mar", value: 5200 },
    { month: "Apr", value: 5350 },
    { month: "May", value: 5480 },
    { month: "Jun", value: 5625 }
  ];

  const transactions = [
    { 
      date: "2024-06-15", 
      type: "Investment", 
      amount: 5000, 
      status: "Completed",
      hash: "0x1a2b3c..."
    },
    { 
      date: "2024-07-01", 
      type: "Interest", 
      amount: 125, 
      status: "Completed",
      hash: "0x4d5e6f..."
    },
    { 
      date: "2024-08-01", 
      type: "Interest", 
      amount: 125, 
      status: "Completed",
      hash: "0x7g8h9i..."
    },
    { 
      date: "2024-09-01", 
      type: "Interest", 
      amount: 125, 
      status: "Pending",
      hash: "0xj1k2l3..."
    }
  ];

  const getRiskColor = () => {
    switch (riskLevel) {
      case "Low": return "bg-green-100 text-green-700";
      case "Medium": return "bg-orange-100 text-orange-700";
      case "High": return "bg-red-100 text-red-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{poolName}</DialogTitle>
              <DialogDescription>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor()}`}>
                  {riskLevel} Risk
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Investment Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Amount Invested</p>
              <p className="text-xl font-bold text-blue-900">
                ${investmentData.amountInvested.toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Current Value</p>
              <p className="text-xl font-bold text-green-900">
                ${investmentData.currentValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">ROI</p>
              <p className="text-xl font-bold text-purple-900">
                +{investmentData.roiPercentage}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200">
              <p className="text-xs text-orange-600 mb-1">Days Remaining</p>
              <p className="text-xl font-bold text-orange-900">
                {investmentData.daysRemaining}
              </p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-semibold mb-4">Performance (6 Months)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8C57FF" 
                  strokeWidth={3}
                  dot={{ fill: '#8C57FF', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction History */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-accent/50 px-4 py-3 border-b">
              <h4 className="font-semibold">Transaction History</h4>
            </div>
            <div className="divide-y">
              {transactions.map((tx, index) => (
                <div key={index} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(tx.status)}
                      <div>
                        <p className="font-medium text-sm">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${tx.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{tx.status}</p>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    asChild
                  >
                    <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                      View on Blockchain
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Contract
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Statement
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-green-600 to-green-700">
              Withdraw Returns
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}