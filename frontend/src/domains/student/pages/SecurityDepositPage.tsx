import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Shield, CheckCircle, AlertCircle, Calendar, FileText } from 'lucide-react';
import { toast } from '@/shared/utils/toast';

export function SecurityDepositPage() {
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositPaymentDate, setDepositPaymentDate] = useState('');
  const [openPayDepositDialog, setOpenPayDepositDialog] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [isRequestingRefund, setIsRequestingRefund] = useState(false);
  const [refundRequested, setRefundRequested] = useState(false);

  const handlePayDeposit = () => {
    setIsPayingDeposit(true);

    setTimeout(() => {
      const paymentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      setDepositPaymentDate(paymentDate);
      setDepositPaid(true);
      setIsPayingDeposit(false);
      setOpenPayDepositDialog(false);
      toast.success('Deposit paid successfully! 🎉');
    }, 1500);
  };

  const handleRequestRefund = () => {
    if (!selectedReason) {
      toast.error('Please select a reason for the refund');
      return;
    }

    setIsRequestingRefund(true);

    setTimeout(() => {
      setRefundRequested(true);
      setIsRequestingRefund(false);
      setOpenRefundDialog(false);
      toast.success('Your deposit will be refunded shortly!');
    }, 1500);
  };

  const refundReasons = [
    'Visa Rejection or Travel Issue',
    'Property Not as Described',
    'Unlivable or Unsafe Property Conditions',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Security Deposit</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your rental security deposit and refund requests
        </p>
      </div>

      {/* Pay Security Deposit Card */}
      {!depositPaid && !refundRequested && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Pay Security Deposit
            </CardTitle>
            <CardDescription>
              Pay your security deposit to confirm your rental
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deposit Details */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 sm:p-6 border border-purple-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm sm:text-base text-purple-700">Security Amount:</span>
                  <span className="text-xl sm:text-2xl font-bold text-purple-900">$500 USDT</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-purple-300">
                  <div>
                    <span className="text-xs sm:text-sm text-purple-700 block mb-1">Pay Due Date:</span>
                    <span className="font-medium text-purple-900 text-sm sm:text-base">Nov 10, 2025</span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-purple-700 block mb-1">Return Date:</span>
                    <span className="font-medium text-purple-900 text-sm sm:text-base">May 10, 2026</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-purple-300 flex-wrap gap-2">
                  <span className="text-xs sm:text-sm text-purple-700">Days Until Payment:</span>
                  <Badge className="bg-purple-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1">
                    3 days
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800">
                💡 Your security deposit will be returned on <strong>May 10, 2026</strong> after property inspection and deducting any damages.
              </p>
            </div>

            {/* Pay Now Button */}
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 h-10 sm:h-11 text-sm sm:text-base"
              onClick={() => setOpenPayDepositDialog(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Pay Security Deposit Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deposit Paid Success Card */}
      {depositPaid && !refundRequested && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Deposit Status
              </CardTitle>
              <CardDescription>
                Your deposit has been paid successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 text-sm sm:text-base">Deposit Paid Successfully! 🎉</p>
                    <p className="text-xs sm:text-sm text-green-700">Your rental is now confirmed</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Amount Paid:</span>
                    <span className="font-medium text-green-900">$500 USDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Payment Date:</span>
                    <span className="font-medium text-green-900">{depositPaymentDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Return Date:</span>
                    <span className="font-medium text-green-900">May 10, 2026</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Deposit Refund Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Request Deposit Refund
              </CardTitle>
              <CardDescription>
                Request a refund in case of visa rejection, travel issues, or property problems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-orange-800">
                      <strong>Important:</strong> You can request a deposit refund if you face:
                    </p>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-orange-700 space-y-1 ml-2">
                      <li>Visa rejection or travel issues</li>
                      <li>Property not matching the description</li>
                      <li>Unlivable or unsafe property conditions</li>
                    </ul>
                    <p className="text-xs sm:text-sm text-orange-800 mt-2">
                      ⚠️ Requesting a refund will terminate your rental contract.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deposit Payment Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Deposit Payment Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Payment Date:</span>
                    <span className="font-medium text-gray-900">{depositPaymentDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Amount:</span>
                    <span className="font-medium text-gray-900">$500 USDT</span>
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-3">
                <Label className="text-base">Select Refund Reason:</Label>
                <div className="space-y-2">
                  {refundReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedReason === reason
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedReason === reason
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {selectedReason === reason && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{reason}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Request Refund Button */}
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-10 sm:h-11 text-sm sm:text-base"
                onClick={() => {
                  if (!selectedReason) {
                    toast.error('Please select a reason for the refund');
                    return;
                  }
                  setOpenRefundDialog(true);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Request Deposit Refund
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Refund Requested Success Card */}
      {refundRequested && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Refund Request Submitted
            </CardTitle>
            <CardDescription>
              Your deposit refund is being processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm sm:text-base">Refund Request Successful! ✅</p>
                  <p className="text-xs sm:text-sm text-green-700">Your deposit will be refunded shortly</p>
                </div>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Refund Amount:</span>
                  <span className="font-medium text-green-900">$500 USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Reason:</span>
                  <span className="font-medium text-green-900">{selectedReason}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Contract Status:</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Terminated
                  </Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-300">
                <p className="text-xs sm:text-sm text-green-700">
                  💡 Your refund will be processed within 3-5 business days. The rental contract has been terminated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Deposit Dialog */}
      <Dialog open={openPayDepositDialog} onOpenChange={setOpenPayDepositDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Pay the security deposit of $500 USDT to confirm your rental
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Security Amount:</span>
                  <span className="text-2xl font-bold text-purple-900">$500 USDT</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-300">
                  <span className="text-sm text-purple-700">Return Date:</span>
                  <span className="font-medium text-purple-900">May 10, 2026</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handlePayDeposit}
              disabled={isPayingDeposit}
            >
              {isPayingDeposit ? 'Processing...' : 'Pay Security Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Request Dialog */}
      <Dialog open={openRefundDialog} onOpenChange={setOpenRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Confirm Refund Request
            </DialogTitle>
            <DialogDescription>
              This action will terminate your rental contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-orange-900 font-medium">
                      ⚠️ Important: Contract Termination
                    </p>
                    <p className="text-xs text-orange-800">
                      By requesting a refund, your rental contract will be <strong>immediately terminated</strong>. 
                      You will no longer have access to the property.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-orange-300 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-700">Refund Amount:</span>
                    <span className="font-medium text-orange-900">$500 USDT</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-700">Reason:</span>
                    <span className="font-medium text-orange-900 text-right text-xs">{selectedReason}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => setOpenRefundDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              onClick={handleRequestRefund}
              disabled={isRequestingRefund}
            >
              {isRequestingRefund ? 'Processing...' : 'Confirm & Request Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
