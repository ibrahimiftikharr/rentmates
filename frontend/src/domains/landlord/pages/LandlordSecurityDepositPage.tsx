import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Shield, AlertCircle, Calendar, User, Home, Loader2 } from 'lucide-react';
import { toast } from '@/shared/utils/toast';
import { getLandlordTenants } from '@/shared/services/joinRequestService';
import { getLandlordRentalSecurityDeposit, refundSecurityDeposit } from '@/shared/services/securityDepositService';
import { socketService } from '@/shared/services/socketService';

interface RentalDeposit {
  id: string;
  status: string;
  propertyTitle: string;
  studentName: string;
  studentEmail: string;
  securityDepositAmount: number;
  securityDepositStatus: 'pending' | 'paid' | 'refunded' | 'overdue';
  securityDepositPaidAt?: string;
  securityDepositRefundedAt?: string;
  securityDepositRefundReason?: string;
  securityDepositDueDate: string;
  movingDate: string;
  canRefund: boolean;
  daysUntilMoving: number;
}

export function LandlordSecurityDepositPage() {
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<RentalDeposit[]>([]);
  const [selectedRental, setSelectedRental] = useState<RentalDeposit | null>(null);
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    // Ensure socket is connected
    socketService.connect();
    console.log('[LandlordSecurityDepositPage] Socket connection status:', socketService.isConnected());
    
    fetchRentalsWithSecurityDeposit();

    // Listen for real-time security deposit updates
    socketService.on('security_deposit_refunded', (data: any) => {
      console.log('[LandlordSecurityDepositPage] Security deposit refunded (real-time):', data);
      toast.success(`Security deposit of $${data.amount} refunded successfully!`);
      fetchRentalsWithSecurityDeposit();
    });

    socketService.on('security_deposit_status_updated', (data: any) => {
      console.log('[LandlordSecurityDepositPage] Security deposit status updated (real-time):', data);
      fetchRentalsWithSecurityDeposit();
    });

    socketService.on('contract_terminated', (data: any) => {
      console.log('[LandlordSecurityDepositPage] Contract terminated (real-time):', data);
      toast.info(`Contract terminated for ${data.propertyTitle}`);
      fetchRentalsWithSecurityDeposit();
    });

    socketService.on('security_deposit_paid', (data: any) => {
      console.log('[LandlordSecurityDepositPage] Security deposit paid (real-time):', data);
      toast.success('Student has paid the security deposit!');
      fetchRentalsWithSecurityDeposit();
    });

    return () => {
      socketService.off('security_deposit_refunded');
      socketService.off('security_deposit_status_updated');
      socketService.off('contract_terminated');
      socketService.off('security_deposit_paid');
    };
  }, []);

  const fetchRentalsWithSecurityDeposit = async () => {
    try {
      setLoading(true);
      const response = await getLandlordTenants();
      
      // Fetch security deposit details for each rental
      const rentalsWithDeposits = await Promise.all(
        response.tenants.map(async (tenant: any) => {
          try {
            const depositResponse = await getLandlordRentalSecurityDeposit(tenant.rentalId);
            return depositResponse.rental;
          } catch (error) {
            console.error(`Failed to fetch deposit for rental ${tenant.rentalId}:`, error);
            return null;
          }
        })
      );

      setRentals(rentalsWithDeposits.filter(r => r !== null));
    } catch (error: any) {
      console.error('Failed to fetch rentals:', error);
      toast.error('Failed to load security deposit information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundDeposit = async () => {
    if (!selectedReason || !selectedRental) {
      toast.error('Please select a reason for the refund');
      return;
    }

    setIsRefunding(true);

    try {
      const response = await refundSecurityDeposit(selectedRental.id, selectedReason);
      
      if (response.success) {
        toast.success('Security deposit refunded successfully!');
        setOpenRefundDialog(false);
        setSelectedReason('');
        setSelectedRental(null);
        // Refresh the rentals list
        await fetchRentalsWithSecurityDeposit();
      }
    } catch (error: any) {
      const errorMessage = error.error || 'Failed to refund security deposit';
      toast.error(errorMessage);
      console.error('Error refunding deposit:', error);
    } finally {
      setIsRefunding(false);
    }
  };

  const refundReasons = [
    'Visa Rejection or Travel Issue',
    'Property Not as Described',
    'Unlivable or Unsafe Property Conditions',
    'Change in Circumstances',
    'Other'
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' },
      refunded: { label: 'Refunded', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={`${config.className} border`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-4 md:mb-6">
          <h1 className="mb-2">Security Deposit Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage security deposits for your rental properties
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Security Deposit Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage security deposits for your rental properties
        </p>
      </div>

      {rentals.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active rentals found</p>
            <p className="text-sm text-gray-500 mt-2">
              Security deposits will appear here once you have active rental agreements
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rentals.map((rental) => (
            <Card key={rental.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5 text-primary" />
                      {rental.propertyTitle}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {rental.studentName} ({rental.studentEmail})
                    </CardDescription>
                  </div>
                  {getStatusBadge(rental.securityDepositStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Deposit Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm sm:text-base text-blue-700">Security Deposit Amount:</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-900">${rental.securityDepositAmount}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-blue-300">
                      <div>
                        <span className="text-xs sm:text-sm text-blue-700 block mb-1">Payment Due Date:</span>
                        <span className="font-medium text-blue-900 text-sm sm:text-base">
                          {new Date(rental.securityDepositDueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm text-blue-700 block mb-1">Moving Date:</span>
                        <span className="font-medium text-blue-900 text-sm sm:text-base">
                          {new Date(rental.movingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {rental.securityDepositPaidAt && (
                      <div className="flex items-center justify-between pt-3 border-t border-blue-300">
                        <span className="text-xs sm:text-sm text-blue-700">Paid On:</span>
                        <span className="font-medium text-blue-900">
                          {new Date(rental.securityDepositPaidAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Refund Information */}
                {rental.securityDepositStatus === 'refunded' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium mb-2">✅ Deposit Refunded</p>
                    {rental.securityDepositRefundReason && (
                      <p className="text-xs text-green-700 mb-1">
                        <strong>Reason:</strong> {rental.securityDepositRefundReason}
                      </p>
                    )}
                    {rental.securityDepositRefundedAt && (
                      <p className="text-xs text-green-700">
                        <strong>Refunded On:</strong> {new Date(rental.securityDepositRefundedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Refund Action */}
                {rental.canRefund && rental.securityDepositStatus === 'paid' && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm text-orange-800">
                            <strong>Refund Available:</strong> You can refund this security deposit before the moving date.
                          </p>
                          <p className="text-xs text-orange-700">
                            Days until moving: <strong>{rental.daysUntilMoving}</strong>
                          </p>
                          <p className="text-xs text-orange-700">
                            ⚠️ Refunding will terminate the rental contract.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        setSelectedRental(rental);
                        setOpenRefundDialog(true);
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Refund Security Deposit
                    </Button>
                  </div>
                )}

                {!rental.canRefund && rental.securityDepositStatus === 'paid' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Refund is no longer available (moving date has passed)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      <Dialog open={openRefundDialog} onOpenChange={setOpenRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Refund Security Deposit
            </DialogTitle>
            <DialogDescription>
              Select a reason and confirm the refund to proceed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium mb-1">
                    ⚠️ Contract Termination Warning
                  </p>
                  <p className="text-xs text-red-800">
                    Refunding the security deposit will <strong>immediately terminate</strong> the rental contract.
                    The student will be notified via email and in-app notification.
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit Info */}
            {selectedRental && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Student:</span>
                    <span className="font-medium text-blue-900">{selectedRental.studentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Property:</span>
                    <span className="font-medium text-blue-900 text-right text-xs">{selectedRental.propertyTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Refund Amount:</span>
                    <span className="font-medium text-blue-900">${selectedRental.securityDepositAmount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base">Select Refund Reason:</Label>
              <div className="space-y-2">
                {refundReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
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
                      <p className="font-medium text-sm">{reason}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenRefundDialog(false);
                setSelectedReason('');
                setSelectedRental(null);
              }}
              className="w-full sm:w-auto"
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              onClick={handleRefundDeposit}
              disabled={isRefunding || !selectedReason}
            >
              {isRefunding ? (
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
