import { useState, useEffect } from 'react';
import { UserPlus, Home, DollarSign, CheckCircle2, Clock, XCircle, FileSignature, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { toast } from '@/shared/utils/toast';
import { ContractSigningPage } from './ContractSigningPage';
import { getStudentJoinRequests, deleteJoinRequest, studentSignContract } from '@/shared/services/joinRequestService';

interface JoinRequest {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  bidAmount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'contract-sent' | 'awaiting-landlord' | 'completed';
  moveInDate?: string;
  leaseDuration?: string;
  securityDeposit?: number;
  contractHash?: string;
  isDisabled?: boolean;
}

export function JoinRequestsPage() {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [signingContract, setSigningContract] = useState<JoinRequest | null>(null);
  const [terminatingContract, setTerminatingContract] = useState<JoinRequest | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'approved' | 'awaiting' | 'completed' | 'pending' | 'rejected'>('approved');
  const [loading, setLoading] = useState(true);

  // Fetch join requests from API
  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await getStudentJoinRequests();
      
      // Map backend response to frontend interface
      const mappedRequests: JoinRequest[] = response.joinRequests.map((req: any) => ({
        id: req._id,
        propertyTitle: req.property?.title || 'Property',
        propertyAddress: req.property?.address || 'Address not available',
        landlordName: req.landlord?.name || 'Unknown',
        bidAmount: req.bidAmount,
        requestDate: req.createdAt,
        status: mapBackendStatus(req.status),
        moveInDate: req.movingDate,
        leaseDuration: req.contract?.leaseDurationMonths ? `${req.contract.leaseDurationMonths} months` : undefined,
        securityDeposit: req.contract?.securityDeposit,
        contractHash: req.contract?.studentSignature?.signature || undefined,
        isDisabled: req.isDisabled || false
      }));

      setJoinRequests(mappedRequests);
    } catch (error: any) {
      console.error('Failed to fetch join requests:', error);
      toast.error(error.error || 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  // Map backend status to frontend status
  const mapBackendStatus = (backendStatus: string): JoinRequest['status'] => {
    switch (backendStatus) {
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'waiting_completion':
        return 'awaiting-landlord';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const handleSignContract = (request: JoinRequest) => {
    setSigningContract(request);
  };

  const handleContractSigned = async (contractHash: string) => {
    if (!signingContract) return;

    try {
      // Call API to sign contract
      await studentSignContract(signingContract.id, contractHash);
      
      // Update request status locally
      setJoinRequests(prev =>
        prev.map(req =>
          req.id === signingContract.id
            ? { 
                ...req, 
                status: 'awaiting-landlord',
                contractHash: contractHash
              }
            : req.id !== signingContract.id && req.status === 'pending'
            ? { ...req, isDisabled: true }
            : req
        )
      );

      toast.success('Contract signed successfully! Waiting for landlord signature.');
      setSigningContract(null);
    } catch (error: any) {
      console.error('Failed to sign contract:', error);
      toast.error(error.error || 'Failed to sign contract');
    }
  };

  const handleTerminateContract = async () => {
    if (!terminatingContract) return;

    setIsTerminating(true);

    try {
      // Call API to delete/terminate request
      await deleteJoinRequest(terminatingContract.id);
      
      // Remove the terminated contract from the list
      setJoinRequests(prev => prev.filter(req => req.id !== terminatingContract.id));
      
      setTerminatingContract(null);
      toast.success('Your security deposit will be returned shortly!');
    } catch (error: any) {
      console.error('Failed to terminate contract:', error);
      toast.error(error.error || 'Failed to terminate contract');
    } finally {
      setIsTerminating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'contract-sent':
      case 'awaiting-landlord':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'awaiting-landlord':
        return 'Awaiting Landlord Signature';
      case 'contract-sent':
        return 'Contract Sent';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // If user is signing a contract, show the contract signing page
  if (signingContract) {
    return (
      <ContractSigningPage
        request={signingContract}
        onBack={() => setSigningContract(null)}
        onContractSigned={handleContractSigned}
      />
    );
  }

  const RequestCard = ({ request }: { request: JoinRequest }) => {
    const isDisabled = request.isDisabled;
    
    return (
      <Card className={`hover:shadow-2xl transition-shadow shadow-lg border-2 ${isDisabled ? 'opacity-50' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`mb-2 ${isDisabled ? 'text-muted-foreground' : ''}`}>
                {request.propertyTitle}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>{request.propertyAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Landlord: {request.landlordName}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor(request.status)} text-white flex-shrink-0 whitespace-nowrap text-xs sm:text-sm max-w-[140px] sm:max-w-none`}>
              <span className="truncate sm:whitespace-normal">{getStatusText(request.status)}</span>
            </Badge>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bid Amount:</span>
              <span className="font-medium flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                ${request.bidAmount}/month
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Request Date:</span>
              <span>{new Date(request.requestDate).toLocaleDateString()}</span>
            </div>

            {request.moveInDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Move-in Date:</span>
                <span>{new Date(request.moveInDate).toLocaleDateString()}</span>
              </div>
            )}

            {request.leaseDuration && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lease Duration:</span>
                <span>{request.leaseDuration}</span>
              </div>
            )}

            {request.securityDeposit && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit:</span>
                <span className="font-medium">${request.securityDeposit}</span>
              </div>
            )}

            {/* Approved Status */}
            {request.status === 'approved' && (
              <>
                <Separator className="my-3" />
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Request Approved ✅</span>
                    </div>
                    <div className="space-y-2 text-sm text-green-800">
                      <div className="font-medium">Next Steps:</div>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Review and sign the rental contract</li>
                        <li>Wait for landlord signature</li>
                        <li>Property ready to take over</li>
                      </ol>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handleSignContract(request)}
                    disabled={isDisabled}
                  >
                    <FileSignature className="w-4 h-4 mr-2" />
                    Sign Rental Contract
                  </Button>
                </div>
              </>
            )}

            {/* Awaiting Landlord Signature */}
            {request.status === 'awaiting-landlord' && (
              <>
                <Separator className="my-3" />
                <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-900">Awaiting Landlord Signature</span>
                  </div>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>Your contract has been signed and submitted to the blockchain.</p>
                    <p>Waiting for the landlord to complete their signature.</p>
                    {request.contractHash && (
                      <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                        <div className="text-xs text-muted-foreground mb-1">Transaction Hash:</div>
                        <div className="font-mono text-xs break-all">{request.contractHash}</div>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 mt-3"
                  onClick={() => setTerminatingContract(request)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Terminate Contract
                </Button>
              </>
            )}

            {/* Completed */}
            {request.status === 'completed' && (
              <>
                <Separator className="my-3" />
                <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Property Ready to Take Over ✅</span>
                  </div>
                  <div className="text-sm text-purple-800">
                    Contract completed successfully! Your move-in is now scheduled.
                  </div>
                  {request.contractHash && (
                    <div className="mt-3 p-2 bg-white rounded border border-purple-300">
                      <div className="text-xs text-muted-foreground mb-1">Contract Hash:</div>
                      <div className="font-mono text-xs break-all">{request.contractHash}</div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 mt-3"
                  onClick={() => setTerminatingContract(request)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Terminate Contract
                </Button>
              </>
            )}

            {/* Rejected */}
            {request.status === 'rejected' && (
              <>
                <Separator className="my-3" />
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Request Rejected</span>
                  </div>
                  <p className="text-red-700 mt-1">The landlord has declined your request</p>
                </div>
              </>
            )}

            {/* Pending */}
            {request.status === 'pending' && !isDisabled && (
              <>
                <Separator className="my-3" />
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Waiting for landlord response</span>
                  </div>
                  <p className="text-yellow-700 mt-1">You'll be notified once the landlord reviews your request</p>
                </div>
              </>
            )}

            {/* Disabled (Another request approved) */}
            {isDisabled && (
              <>
                <Separator className="my-3" />
                <div className="p-3 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-600">
                  <div className="font-medium">Request Disabled</div>
                  <p className="mt-1">Another join request was approved. This request will be auto-deleted in 1 week.</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const approvedRequests = joinRequests.filter(r => r.status === 'approved');
  const awaitingRequests = joinRequests.filter(r => r.status === 'awaiting-landlord');
  const completedRequests = joinRequests.filter(r => r.status === 'completed');
  const pendingRequests = joinRequests.filter(r => r.status === 'pending' && !r.isDisabled);
  const rejectedRequests = joinRequests.filter(r => r.status === 'rejected');

  if (loading) {
    return (
      <div className="space-y-6">
        <h1>Join Requests</h1>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading join requests...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Join Requests</h1>
          <p className="text-muted-foreground">
            Track your tenant join requests and rental contracts
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                <p className="text-2xl">{pendingRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Requests</p>
                <p className="text-2xl">{approvedRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Awaiting Signature</p>
                <p className="text-2xl">{awaitingRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileSignature className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl">{completedRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setSelectedTab('approved')}
          variant={selectedTab === 'approved' ? 'default' : 'outline'}
          className={`${selectedTab === 'approved' ? 'bg-primary' : ''}`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Action Required
          {approvedRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{approvedRequests.length}</Badge>
          )}
        </Button>
        <Button
          onClick={() => setSelectedTab('awaiting')}
          variant={selectedTab === 'awaiting' ? 'default' : 'outline'}
          className={`${selectedTab === 'awaiting' ? 'bg-primary' : ''}`}
        >
          <FileSignature className="w-4 h-4 mr-2" />
          Awaiting Completion
          {awaitingRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{awaitingRequests.length}</Badge>
          )}
        </Button>
        <Button
          onClick={() => setSelectedTab('completed')}
          variant={selectedTab === 'completed' ? 'default' : 'outline'}
          className={`${selectedTab === 'completed' ? 'bg-primary' : ''}`}
        >
          <Home className="w-4 h-4 mr-2" />
          Completed
          {completedRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{completedRequests.length}</Badge>
          )}
        </Button>
        <Button
          onClick={() => setSelectedTab('pending')}
          variant={selectedTab === 'pending' ? 'default' : 'outline'}
          className={`${selectedTab === 'pending' ? 'bg-primary' : ''}`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending Confirmation
          {pendingRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{pendingRequests.length}</Badge>
          )}
        </Button>
        <Button
          onClick={() => setSelectedTab('rejected')}
          variant={selectedTab === 'rejected' ? 'default' : 'outline'}
          className={`${selectedTab === 'rejected' ? 'bg-primary' : ''}`}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Rejected
          {rejectedRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{rejectedRequests.length}</Badge>
          )}
        </Button>
      </div>

      {/* Approved Requests */}
      {selectedTab === 'approved' && (
        <>
          {approvedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Action Required</h3>
              <p className="text-muted-foreground">
                You don't have any approved requests waiting for signatures
              </p>
            </Card>
          )}
        </>
      )}

      {/* Awaiting Requests */}
      {selectedTab === 'awaiting' && (
        <>
          {awaitingRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {awaitingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <FileSignature className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Pending Signatures</h3>
              <p className="text-muted-foreground">
                You don't have any contracts waiting for landlord signatures
              </p>
            </Card>
          )}
        </>
      )}

      {/* Completed Requests */}
      {selectedTab === 'completed' && (
        <>
          {completedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Completed Contracts</h3>
              <p className="text-muted-foreground">
                You don't have any completed rental contracts yet
              </p>
            </Card>
          )}
        </>
      )}

      {/* Pending Requests */}
      {selectedTab === 'pending' && (
        <>
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                You don't have any requests waiting for landlord response
              </p>
            </Card>
          )}
        </>
      )}

      {/* Rejected Requests */}
      {selectedTab === 'rejected' && (
        <>
          {rejectedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rejectedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Rejected Requests</h3>
              <p className="text-muted-foreground">
                You don't have any rejected requests
              </p>
            </Card>
          )}
        </>
      )}

      {joinRequests.length === 0 && (
        <Card className="p-12 text-center">
          <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2">No Join Requests</h3>
          <p className="text-muted-foreground mb-6">
            You haven't sent any tenant join requests yet
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            Browse Properties
          </Button>
        </Card>
      )}

      {/* Contract Termination Dialog */}
      <Dialog open={!!terminatingContract} onOpenChange={() => setTerminatingContract(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Confirm Contract Termination
            </DialogTitle>
            <DialogDescription>
              This action will terminate your rental contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-900 font-medium">
                      ⚠️ Important: Contract Will Be Terminated
                    </p>
                    <p className="text-xs text-red-800">
                      By terminating the contract, you will <strong>no longer have access</strong> to the property. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-red-300 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-700">Property:</span>
                    <span className="font-medium text-red-900 text-right text-xs">
                      {terminatingContract?.propertyTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-700">Security Deposit:</span>
                    <span className="font-medium text-red-900">
                      ${terminatingContract?.securityDeposit || 500}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                ✓ Your security deposit, if paid, will be returned to your wallet shortly after termination.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => setTerminatingContract(null)}
              className="w-full sm:w-auto"
              disabled={isTerminating}
            >
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              onClick={handleTerminateContract}
              disabled={isTerminating}
            >
              {isTerminating ? 'Terminating...' : 'Confirm Termination'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
