import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Shield, CheckCircle, AlertCircle, Calendar, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/shared/utils/toast';
import axios from 'axios';
import { socketService } from '@/shared/services/socketService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface SecurityDepositData {
  amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'overdue';
  dueDate: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  daysUntilDue: number;
  isOverdue: boolean;
  canRefund: boolean;
  movingDate: string;
}

interface RentalData {
  id: string;
  propertyTitle: string;
  monthlyRent: number;
  leaseStartDate: string;
  leaseEndDate: string;
}

export function SecurityDepositPage() {
  const [loading, setLoading] = useState(true);
  const [securityDeposit, setSecurityDeposit] = useState<SecurityDepositData | null>(null);
  const [rental, setRental] = useState<RentalData | null>(null);
  const [openPayDepositDialog, setOpenPayDepositDialog] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [isRequestingRefund, setIsRequestingRefund] = useState(false);

  useEffect(() => {
    // Ensure socket is connected
    socketService.connect();
    console.log('[SecurityDepositPage] Socket connection status:', socketService.isConnected());
    
    fetchSecurityDepositStatus();

    // Listen for real-time security deposit updates
    socketService.on('security_deposit_paid', (data: any) => {
      console.log('[SecurityDepositPage] Security deposit paid (real-time):', data);
      toast.success('Security deposit payment confirmed! 🎉');
      fetchSecurityDepositStatus();
    });

    socketService.on('security_deposit_refunded', (data: any) => {
      console.log('[SecurityDepositPage] Security deposit refunded (real-time):', data);
      toast.success(`Security deposit refunded: $${data.amount} USDT! Contract terminated.`);
      fetchSecurityDepositStatus();
    });

    socketService.on('security_deposit_status_updated', (data: any) => {
      console.log('[SecurityDepositPage] Security deposit status updated (real-time):', data);
      fetchSecurityDepositStatus();
    });

    return () => {
      socketService.off('security_deposit_paid');
      socketService.off('security_deposit_refunded');
      socketService.off('security_deposit_status_updated');
    };
  }, []);

  const fetchSecurityDepositStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/security-deposit/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSecurityDeposit(response.data.securityDeposit);
        setRental(response.data.rental);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No active rental found
        console.log('No active rental with security deposit found');
      } else {
        toast.error('Failed to load security deposit information');
        console.error('Error fetching security deposit:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    setIsPayingDeposit(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/security-deposit/pay`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Deposit paid successfully! 🎉');
        setOpenPayDepositDialog(false);
        // Refresh data
        await fetchSecurityDepositStatus();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to pay deposit';
      toast.error(errorMessage);
      console.error('Error paying deposit:', error);
    } finally {
      setIsPayingDeposit(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for the refund');
      return;
    }

    setIsRequestingRefund(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/security-deposit/request-refund`,
        { reason: selectedReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Security deposit refunded successfully! Contract terminated. 🎉');
        setOpenRefundDialog(false);
        setSelectedReason('');
        // Refresh data
        await fetchSecurityDepositStatus();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to process refund';
      toast.error(errorMessage);
      console.error('Error requesting refund:', error);
    } finally {
      setIsRequestingRefund(false);
    }
  };

  const refundReasons = [
    'Visa Rejection or Travel Issue',
    'Property Not as Described',
    'Unlivable or Unsafe Property Conditions',
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-4 md:mb-6">
          <h1 className="mb-2">Security Deposit</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your rental security deposit and refund requests
          </p>
        </div>
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!securityDeposit || !rental) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-4 md:mb-6">
          <h1 className="mb-2">Security Deposit</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your rental security deposit and refund requests
          </p>
        </div>
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active rental found</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete a rental agreement to manage your security deposit
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const depositPaid = securityDeposit.status === 'paid';
  const depositRefunded = securityDeposit.status === 'refunded';
  const depositPending = securityDeposit.status === 'pending';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Security Deposit</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your rental security deposit and refund requests
        </p>
      </div>

      {/* Pay Security Deposit Card */}
      {depositPending && !depositRefunded && (
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
                  <span className="text-xl sm:text-2xl font-bold text-purple-900">${securityDeposit.amount} USDT</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-purple-300">
                  <div>
                    <span className="text-xs sm:text-sm text-purple-700 block mb-1">Pay Due Date:</span>
                    <span className="font-medium text-purple-900 text-sm sm:text-base">
                      {new Date(securityDeposit.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-purple-700 block mb-1">Moving Date:</span>
                    <span className="font-medium text-purple-900 text-sm sm:text-base">
                      {new Date(securityDeposit.movingDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-purple-300 flex-wrap gap-2">
                  <span className="text-xs sm:text-sm text-purple-700">Days Until Payment:</span>
                  <Badge className={`${
                    securityDeposit.daysUntilDue <= 1 ? 'bg-red-600' : 
                    securityDeposit.daysUntilDue <= 3 ? 'bg-orange-600' : 'bg-purple-600'
                  } text-white text-xs sm:text-sm px-2 sm:px-3 py-1`}>
                    {securityDeposit.daysUntilDue <= 0 ? 'Overdue' : `${securityDeposit.daysUntilDue} days`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className={`border rounded-lg p-3 sm:p-4 ${
              securityDeposit.daysUntilDue <= 1 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-xs sm:text-sm ${
                securityDeposit.daysUntilDue <= 1 ? 'text-red-800' : 'text-blue-800'
              }`}>
                {securityDeposit.daysUntilDue <= 1 ? (
                  <>⚠️ <strong>URGENT:</strong> Your security deposit is due very soon! If not paid by the deadline, your contract will be automatically terminated.</>
                ) : (
                  <>💡 Your security deposit will be returned after your lease ends on <strong>{new Date(rental.leaseEndDate).toLocaleDateString()}</strong> after property inspection and deducting any damages.</>
                )}
              </p>
            </div>

            {/* Pay Now Button */}
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 h-10 sm:h-11 text-sm sm:text-base"
              onClick={() => setOpenPayDepositDialog(true)}
              disabled={securityDeposit.isOverdue}
            >
              <Shield className="w-4 h-4 mr-2" />
              {securityDeposit.isOverdue ? 'Payment Overdue' : 'Pay Security Deposit Now'}
            </Button>
            {securityDeposit.isOverdue && (
              <p className="text-xs text-red-600 text-center">
                The payment deadline has passed. Your contract will be terminated automatically.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deposit Paid Success Card */}
      {depositPaid && !depositRefunded && (
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
                    <span className="font-medium text-green-900">${securityDeposit.amount} USDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Payment Date:</span>
                    <span className="font-medium text-green-900">
                      {securityDeposit.paidAt ? new Date(securityDeposit.paidAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Lease End Date:</span>
                    <span className="font-medium text-green-900">
                      {new Date(rental.leaseEndDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Deposit Refund Card - Only show if refund is allowed */}
          {securityDeposit.canRefund && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Request Deposit Refund
                </CardTitle>
                <CardDescription>
                  Request a refund in case of visa rejection, travel issues, or property problems (before moving date)
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
                        ⚠️ Refund requests will automatically terminate your rental contract.
                      </p>
                      <p className="text-xs sm:text-sm text-orange-800">
                        📅 Refunds are only available before the moving date: <strong>{new Date(securityDeposit.movingDate).toLocaleDateString()}</strong>
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
                      <span className="font-medium text-gray-900">
                        {securityDeposit.paidAt ? new Date(securityDeposit.paidAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Amount:</span>
                      <span className="font-medium text-gray-900">${securityDeposit.amount} USDT</span>
                    </div>
                  </div>
                </div>

                {/* Refund Button */}
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setOpenRefundDialog(true)}
                  disabled={!securityDeposit.canRefund}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {securityDeposit.canRefund ? 'Request Deposit Refund' : 'Refund Not Available'}
                </Button>
                {!securityDeposit.canRefund && (
                  <p className="text-xs text-gray-600 text-center">
                    Refunds are only available before the moving date
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Refund Processed Success Card */}
      {depositRefunded && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Security Deposit Refunded
            </CardTitle>
            <CardDescription>
              Your deposit has been refunded and the contract has been terminated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm sm:text-base">Deposit Refunded! ✅</p>
                  <p className="text-xs sm:text-sm text-green-700">The refund has been processed</p>
                </div>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Refund Amount:</span>
                  <span className="font-medium text-green-900">${securityDeposit.amount} USDT</span>
                </div>
                {securityDeposit.refundReason && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Reason:</span>
                    <span className="font-medium text-green-900">{securityDeposit.refundReason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Refund Date:</span>
                  <span className="font-medium text-green-900">
                    {securityDeposit.refundedAt ? new Date(securityDeposit.refundedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
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
                  💡 The refund has been credited to your wallet. The rental contract has been terminated.
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
              Pay the security deposit of ${securityDeposit?.amount || 0} USDT to confirm your rental
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Security Amount:</span>
                  <span className="text-2xl font-bold text-purple-900">${securityDeposit?.amount || 0} USDT</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-300">
                  <span className="text-sm text-purple-700">Lease End Date:</span>
                  <span className="font-medium text-purple-900">
                    {rental ? new Date(rental.leaseEndDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
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
              Request Security Deposit Refund
            </DialogTitle>
            <DialogDescription>
              Select a reason and confirm to automatically refund your deposit and terminate the contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Refund Reason</Label>
              {refundReasons.map((reason) => (
                <div
                  key={reason}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedReason === reason
                          ? 'border-orange-600 bg-orange-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedReason === reason && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">{reason}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-orange-900 font-medium">
                    Important: This action will:
                  </p>
                  <ul className="text-xs text-orange-800 space-y-1 ml-4 list-disc">
                    <li>Automatically refund ${securityDeposit?.amount || 0} USDT to your wallet</li>
                    <li>Terminate your rental contract immediately</li>
                    <li>Clear all rental-related data</li>
                    <li>Notify the landlord about the termination</li>
                  </ul>
                  <p className="text-xs text-orange-800 mt-2">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setOpenRefundDialog(false);
                setSelectedReason('');
              }}
              disabled={isRequestingRefund}
            >
              Cancel
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleRequestRefund}
              disabled={isRequestingRefund || !selectedReason}
            >
              {isRequestingRefund ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
