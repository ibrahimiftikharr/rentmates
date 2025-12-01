import { useState, useEffect } from 'react';
import { 
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
  FileText,
  Shield,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { getLandlordJoinRequests, acceptJoinRequest, rejectJoinRequest } from '@/shared/services/joinRequestService';
import { toast } from '@/shared/utils/toast';
import { socketService } from '@/shared/services/socketService';

interface JoinRequest {
  id: string;
  propertyName: string;
  propertyId: string;
  studentName: string;
  studentId: string;
  studentPhoto: string;
  bidAmount: string;
  leaseDuration: string;
  moveInDate: string;
  status: 'pending' | 'approved' | 'rejected';
  contractSigned: boolean;
  blockchainVerified: boolean;
  contractId?: string;
  // Extended details
  studentBio: string;
  interests: string[];
  kycVerified: boolean;
  rentalScore?: number;
  // Approval flow tracking
  landlordApproved?: boolean;
  studentSigned?: boolean;
  landlordSigned?: boolean;
}

interface JoinRequestsPageProps {
  onNavigate: (page: string, requestId?: string) => void;
}

export function JoinRequestsPage({ onNavigate }: JoinRequestsPageProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch join requests from API
  useEffect(() => {
    fetchJoinRequests();

    // Listen for new join requests via Socket.IO
    socketService.on('new_join_request', (data: any) => {
      console.log('New join request received:', data);
      toast.info(`New join request from ${data.student?.name || 'a student'}`);
      fetchJoinRequests(); // Refresh the list
    });

    return () => {
      socketService.off('new_join_request');
    };
  }, []);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await getLandlordJoinRequests();
      
      // Map backend response to frontend interface
      const mappedRequests: JoinRequest[] = response.joinRequests.map((req: any) => {
        return {
          id: req._id,
          propertyName: req.property?.title || 'Property',
          propertyId: req.property?._id || '',
          studentName: req.student?.name || 'Student',
          studentId: req.student?._id || '',
          studentPhoto: req.studentProfile?.profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
          bidAmount: req.bidAmount.toString(),
          leaseDuration: req.contract?.leaseDurationMonths?.toString() || '12',
          moveInDate: req.movingDate,
          status: mapBackendStatus(req.status),
          contractSigned: req.status === 'completed',
          blockchainVerified: req.status === 'completed',
          contractId: req.status === 'completed' ? `CONTRACT-${req._id.slice(-6)}` : undefined,
          studentBio: req.studentProfile?.bio || req.message || 'No bio available',
          interests: req.studentProfile?.interests || [],
          kycVerified: true,
          rentalScore: req.studentProfile?.reputationScore || 0,
          landlordApproved: req.status === 'approved' || req.status === 'waiting_completion' || req.status === 'completed',
          studentSigned: req.contract?.studentSignature?.signed || false,
          landlordSigned: req.contract?.landlordSignature?.signed || false
        };
      });

      setRequests(mappedRequests);
    } catch (error: any) {
      console.error('Failed to fetch join requests:', error);
      toast.error(error.error || 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  // Map backend status to frontend status
  const mapBackendStatus = (backendStatus: string): 'pending' | 'approved' | 'rejected' => {
    switch (backendStatus) {
      case 'pending':
        return 'pending';
      case 'approved':
      case 'waiting_completion':
      case 'completed':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'approved':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await acceptJoinRequest(id);
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === id ? { 
          ...req, 
          status: 'approved' as const,
          landlordApproved: true,
          contractId: `CONTRACT-${id.slice(-6)}`
        } : req
      ));
      
      setShowApproveModal(null);
      showSuccessToast('✅ Student has been notified of your approval.');
      
      // Refresh requests to get updated data
      await fetchJoinRequests();
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast.error(error.error || 'Failed to approve request');
    }
  };

  const handleViewContract = (id: string) => {
    const request = requests.find(req => req.id === id);
    if (request) {
      onNavigate('view-contract', request.id);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectJoinRequest(id, 'Request rejected by landlord');
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: 'rejected' as const } : req
      ));
      
      setShowRejectModal(null);
      showSuccessToast('Request rejected successfully');
      
      // Refresh requests to get updated data
      await fetchJoinRequests();
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast.error(error.error || 'Failed to reject request');
    }
  };

  const showSuccessToast = (message: string) => {
    setShowToast({ message, type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">Join Requests</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Loading join requests...</p>
        </div>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">Join Requests</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Review and manage student rental requests</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="flex-1 min-w-full sm:min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property or student name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] text-sm">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Requests Cards */}
      <div className="space-y-3 sm:space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-12 text-center shadow-lg">
            <p className="text-muted-foreground">No requests found</p>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="shadow-lg hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4">
                  {/* Left: Student Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                    <img
                      src={request.studentPhoto}
                      alt={request.studentName}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[#4A4A68] truncate text-base sm:text-lg">{request.studentName}</h3>
                        <button className="text-[#8C57FF] hover:text-[#7645E8] transition-colors flex-shrink-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">Reputation Score: {request.rentalScore}/100</p>
                      <Badge className={`text-xs ${request.kycVerified 
                        ? 'bg-green-500/10 text-green-700 border-green-200'
                        : 'bg-red-500/10 text-red-700 border-red-200'
                      }`}>
                        {request.kycVerified ? '✓ KYC Verified' : '✗ Not Verified'}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <Badge className={`${getStatusColor(request.status)} text-xs`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      {request.blockchainVerified && (
                        <Badge className="bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20 text-xs">
                          🟢 On-chain
                        </Badge>
                      )}
                    </div>
                    
                    {request.status === 'pending' && !request.landlordApproved && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setShowApproveModal(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-xs h-8"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRejectModal(request.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 h-8 px-2"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    )}
                    {request.landlordApproved && !request.contractSigned && (
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          disabled
                          className="bg-gray-400 text-xs h-8 cursor-not-allowed"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          Approved
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleViewContract(request.id)}
                          className="bg-[#8C57FF] hover:bg-[#7645E8] text-xs h-8"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          View Contract
                        </Button>
                        {!request.studentSigned && (
                          <p className="text-xs text-muted-foreground italic">Awaiting Student Signature</p>
                        )}
                        {request.studentSigned && !request.landlordSigned && (
                          <p className="text-xs text-green-600 italic">✓ Student Signed - Your Signature Needed</p>
                        )}
                        {request.studentSigned && request.landlordSigned && (
                          <p className="text-xs text-green-600 italic">✓ Fully Signed</p>
                        )}
                      </div>
                    )}
                    {request.status === 'approved' && request.contractSigned && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewContract(request.id)}
                        className="text-[#8C57FF] hover:text-[#7645E8] text-xs h-8"
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">View Contract</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Property & Request Details */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-[#F4F5FA] rounded-lg">
                  <div>
                    <p className="text-xs text-[#8C57FF] mb-1 truncate">Property</p>
                    <p className="text-xs sm:text-sm text-[#4A4A68] truncate">{request.propertyName}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Bid Amount</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68]">£{request.bidAmount}/mo</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Duration</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68]">{request.leaseDuration} months</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Move-in Date</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68]">
                      {new Date(request.moveInDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Expand Button */}
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(request.id)}
                    className="text-[#8C57FF] hover:text-[#7645E8] hover:bg-[#8C57FF]/5"
                  >
                    {expandedRow === request.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show More Details
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRow === request.id && (
                <div className="px-6 pb-6 border-t pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-[#8C57FF]" />
                          <p className="text-sm text-[#8C57FF]">Student Bio</p>
                        </div>
                        <p className="text-sm text-[#4A4A68]">{request.studentBio}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-[#8C57FF]">Interests</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.interests && request.interests.length > 0 ? (
                            request.interests.map((interest, idx) => (
                              <Badge key={idx} variant="outline" className="bg-white">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No interests listed</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-[#8C57FF]" />
                          <p className="text-sm text-[#8C57FF]">Verification Status</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-[#F4F5FA] rounded">
                            <span className="text-sm text-[#4A4A68]">KYC Verification</span>
                            <Badge className={request.kycVerified 
                              ? 'bg-green-500/10 text-green-700 border-green-200'
                              : 'bg-red-500/10 text-red-700 border-red-200'
                            }>
                              {request.kycVerified ? '✓ Verified' : '✗ Not Verified'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#F4F5FA] rounded">
                            <span className="text-sm text-[#4A4A68]">Reputation Score</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#4A4A68]">{request.rentalScore}/100</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < Math.round((request.rentalScore! / 100) * 5) ? 'text-yellow-500' : 'text-gray-300'}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons in Expanded View */}
                  {request.status === 'pending' && !request.landlordApproved && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
                      <Button
                        onClick={() => setShowApproveModal(request.id)}
                        className="bg-[#8C57FF] hover:bg-[#7645E8] flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Request
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectModal(request.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300 flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Request
                      </Button>
                    </div>
                  )}
                  {request.landlordApproved && !request.contractSigned && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex flex-col items-center gap-3">
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">
                          ✓ Approved by You
                        </Badge>
                        <Button
                          onClick={() => handleViewContract(request.id)}
                          className="bg-[#8C57FF] hover:bg-[#7645E8] w-full sm:w-auto"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Contract
                        </Button>
                        {!request.studentSigned && (
                          <p className="text-sm text-muted-foreground italic">Awaiting Student Signature</p>
                        )}
                        {request.studentSigned && !request.landlordSigned && (
                          <p className="text-sm text-green-600 font-medium italic">✓ Student Signed - Your Signature Needed</p>
                        )}
                        {request.studentSigned && request.landlordSigned && (
                          <p className="text-sm text-green-600 font-medium italic">✓ Contract Fully Signed</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="text-[#4A4A68]">Approve Request</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to approve this rental request? A smart contract will be generated and sent to the student for review and signature.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowApproveModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(showApproveModal)}
              >
                Approve
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <X className="h-5 w-5 text-red-600" />
              <h3 className="text-[#4A4A68]">Reject Request</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to reject this rental request? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => handleReject(showRejectModal)}
              >
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          showToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {showToast.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          {showToast.message}
        </div>
      )}
    </div>
  );
}
