import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Video,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Copy,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Calendar } from '@/shared/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { visitRequestService, VisitRequest as VisitRequestType } from '@/shared/services/visitRequestService';
import { socketService } from '@/shared/services/socketService';
import { toast } from 'sonner';

interface VisitRequest {
  id: string;
  propertyName: string;
  propertyAddress: string;
  propertyId: string;
  studentName: string;
  studentId: string;
  studentPhoto: string;
  visitType: 'physical' | 'virtual';
  requestedDate: string;
  requestedTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'disapproved';
  meetLink?: string;
  notes?: string;
}

const MOCK_REQUESTS: VisitRequest[] = [
  {
    id: '1',
    propertyName: 'Modern 2-Bed Flat in City Centre',
    propertyAddress: '123 High Street, London, SW1A 1AA',
    propertyId: '1',
    studentName: 'Emma Thompson',
    studentId: 's1',
    studentPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    visitType: 'physical',
    requestedDate: '2025-11-15',
    requestedTime: '14:00',
    status: 'pending'
  },
  {
    id: '2',
    propertyName: 'Cosy Studio Near University',
    propertyAddress: '45 Park Lane, Manchester, M1 2AB',
    propertyId: '2',
    studentName: 'James Wilson',
    studentId: 's2',
    studentPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    visitType: 'virtual',
    requestedDate: '2025-11-12',
    requestedTime: '10:30',
    status: 'pending'
  },
  {
    id: '3',
    propertyName: 'Spacious 3-Bed House with Garden',
    propertyAddress: '78 Oak Avenue, Birmingham, B2 4QA',
    propertyId: '3',
    studentName: 'Sarah Johnson',
    studentId: 's3',
    studentPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    visitType: 'physical',
    requestedDate: '2025-11-18',
    requestedTime: '16:00',
    status: 'confirmed'
  },
  {
    id: '4',
    propertyName: 'Modern 2-Bed Flat in City Centre',
    propertyAddress: '123 High Street, London, SW1A 1AA',
    propertyId: '1',
    studentName: 'Michael Chen',
    studentId: 's4',
    studentPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    visitType: 'virtual',
    requestedDate: '2025-11-10',
    requestedTime: '15:00',
    status: 'confirmed',
    meetLink: 'https://meet.google.com/abc-defg-hij'
  }
];

export function VisitRequestsPage() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual'>('physical');
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null);
  const [showDisapproveModal, setShowDisapproveModal] = useState<string | null>(null);
  const [showMeetLinkModal, setShowMeetLinkModal] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [disapproveReason, setDisapproveReason] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [landlordNotes, setLandlordNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchVisitRequests();

    // Listen for real-time updates
    socketService.on('new_visit_request', () => {
      fetchVisitRequests();
      toast.info('New visit request received');
    });

    return () => {
      socketService.off('new_visit_request');
    };
  }, []);

  const fetchVisitRequests = async () => {
    try {
      setIsLoading(true);
      const response = await visitRequestService.getLandlordVisitRequests();
      
      // Transform backend data to match UI structure
      const transformedRequests: VisitRequest[] = response.map((request: VisitRequestType) => {
        return {
          id: request._id,
          propertyName: request.property?.title || 'Property',
          propertyAddress: request.property?.location || request.property?.address || 'Address not available',
          propertyId: request.property?._id || '',
          studentName: request.student?.fullName || request.student?.user?.name || 'Student',
          studentId: request.student?._id || '',
          studentPhoto: request.student?.profilePicture || 'https://via.placeholder.com/100',
          visitType: request.visitType === 'virtual' ? 'virtual' : 'physical',
          requestedDate: request.visitDate ? new Date(request.visitDate).toISOString().split('T')[0] : '',
          requestedTime: request.visitTime || '',
          status: request.status === 'confirmed' || request.status === 'rescheduled' ? 'confirmed' : 
                  request.status === 'rejected' ? 'disapproved' : 
                  request.status === 'completed' ? 'completed' : 'pending',
          meetLink: request.meetLink,
          notes: request.landlordNotes,
        };
      });

      setRequests(transformedRequests);
    } catch (error: any) {
      console.error('Error fetching visit requests:', error);
      toast.error(error.message || 'Failed to fetch visit requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'disapproved':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredRequests = requests.filter(req => req.visitType === activeTab);

  const handleConfirm = async (id: string) => {
    const request = requests.find(r => r.id === id);
    
    if (request?.visitType === 'virtual') {
      setShowMeetLinkModal(id);
    } else {
      try {
        setIsConfirming(true);
        await visitRequestService.confirmVisitRequest(id);
        toast.success('Visit confirmed successfully!');
        await fetchVisitRequests();
      } catch (error: any) {
        toast.error(error.message || 'Failed to confirm visit');
      } finally {
        setIsConfirming(false);
      }
    }
  };

  const handleConfirmWithMeetLink = async () => {
    if (!meetLink.trim()) {
      toast.error('Please enter a valid Google Meet link');
      return;
    }

    // Validate Google Meet link
    const meetLinkRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    if (!meetLinkRegex.test(meetLink.trim())) {
      toast.error('Please enter a valid Google Meet link (e.g., https://meet.google.com/abc-defg-hij)');
      return;
    }

    try {
      setIsConfirming(true);
      await visitRequestService.confirmVisitRequest(showMeetLinkModal!, meetLink.trim());
      setShowMeetLinkModal(null);
      setMeetLink('');
      toast.success('Virtual visit confirmed with meeting link!');
      await fetchVisitRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm visit');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      setIsRescheduling(true);
      await visitRequestService.rescheduleVisitRequest(
        showRescheduleModal!,
        rescheduleDate.toISOString(),
        rescheduleTime,
        landlordNotes
      );
      
      setShowRescheduleModal(null);
      setRescheduleDate(undefined);
      setRescheduleTime('');
      setLandlordNotes('');
      toast.success('Visit rescheduled successfully!');
      await fetchVisitRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reschedule visit');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleDisapprove = async () => {
    if (!disapproveReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsRejecting(true);
      await visitRequestService.rejectVisitRequest(showDisapproveModal!, disapproveReason);
      setShowDisapproveModal(null);
      setDisapproveReason('');
      toast.success('Visit request declined');
      await fetchVisitRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject visit');
    } finally {
      setIsRejecting(false);
    }
  };

  const copyMeetLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard!');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#4A4A68] mb-2">Visit Requests</h1>
        <p className="text-muted-foreground">Manage student property visit requests</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'physical' | 'virtual')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white border">
          <TabsTrigger value="physical" className="data-[state=active]:bg-[#8C57FF] data-[state=active]:text-white">
            <MapPin className="h-4 w-4 mr-2" />
            Physical Visits
          </TabsTrigger>
          <TabsTrigger value="virtual" className="data-[state=active]:bg-[#8C57FF] data-[state=active]:text-white">
            <Video className="h-4 w-4 mr-2" />
            Virtual Visits
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-[#8C57FF] mb-4 animate-spin" />
                <h3 className="text-[#4A4A68] mb-2">Loading visit requests...</h3>
                <p className="text-muted-foreground">Please wait while we fetch your data</p>
              </div>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center">
                {activeTab === 'physical' ? (
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                ) : (
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                )}
                <h3 className="text-[#4A4A68] mb-2">No {activeTab} visit requests</h3>
                <p className="text-muted-foreground">
                  You don't have any {activeTab} visit requests at the moment
                </p>
              </div>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="p-4 sm:p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  {/* Student Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <img
                      src={request.studentPhoto}
                      alt={request.studentName}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-[#4A4A68] text-base sm:text-lg truncate">{request.studentName}</h3>
                        <button className="text-[#8C57FF] hover:text-[#7645E8] transition-colors flex-shrink-0">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-[#8C57FF] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-[#4A4A68] truncate">{request.propertyName}</p>
                            <p className="text-xs text-muted-foreground break-words">{request.propertyAddress}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#8C57FF] flex-shrink-0" />
                            <span className="text-[#4A4A68]">
                              {new Date(request.requestedDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-[#8C57FF] flex-shrink-0" />
                            <span className="text-[#4A4A68]">{request.requestedTime}</span>
                          </div>
                        </div>

                        {request.meetLink && (
                          <div className="flex items-center gap-2 p-2 bg-[#8C57FF]/5 rounded-lg min-w-0">
                            <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#8C57FF] flex-shrink-0" />
                            <a
                              href={request.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-[#8C57FF] hover:underline flex-1 truncate min-w-0"
                            >
                              {request.meetLink}
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyMeetLink(request.meetLink!)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-row lg:flex-col items-start justify-between lg:items-end gap-3 sm:gap-4 lg:min-w-[200px]">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>

                    {request.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isConfirming}
                        >
                          {isConfirming ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowRescheduleModal(request.id);
                            setRescheduleDate(new Date(request.requestedDate));
                            setRescheduleTime(request.requestedTime);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDisapproveModal(request.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Disapprove
                        </Button>
                      </div>
                    )}

                    {request.status === 'confirmed' && request.visitType === 'virtual' && !request.meetLink && (
                      <Button
                        size="sm"
                        onClick={() => setShowMeetLinkModal(request.id)}
                        className="bg-[#8C57FF] hover:bg-[#7645E8]"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Add Meet Link
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-[#8C57FF]" />
              <h3 className="text-[#4A4A68]">Reschedule Visit</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Select New Date</Label>
                <div className="mt-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>

              <div>
                <Label>Select Time</Label>
                <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">01:00 PM</SelectItem>
                    <SelectItem value="14:00">02:00 PM</SelectItem>
                    <SelectItem value="15:00">03:00 PM</SelectItem>
                    <SelectItem value="16:00">04:00 PM</SelectItem>
                    <SelectItem value="17:00">05:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes for the student about the reschedule..."
                  value={landlordNotes}
                  onChange={(e) => setLandlordNotes(e.target.value)}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRescheduleModal(null);
                  setRescheduleDate(undefined);
                  setRescheduleTime('');
                  setLandlordNotes('');
                }}
                disabled={isRescheduling}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#8C57FF] hover:bg-[#7645E8]"
                onClick={handleReschedule}
                disabled={isRescheduling}
              >
                {isRescheduling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rescheduling...</> : 'Confirm Reschedule'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Disapprove Modal */}
      {showDisapproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <X className="h-5 w-5 text-red-600" />
              <h3 className="text-[#4A4A68]">Disapprove Visit Request</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={disapproveReason}
                  onChange={(e) => setDisapproveReason(e.target.value)}
                  placeholder="Let the student know why the visit cannot be accommodated..."
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDisapproveModal(null);
                  setDisapproveReason('');
                }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDisapprove}
                disabled={isRejecting}
              >
                {isRejecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</> : 'Disapprove'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Meet Link Modal */}
      {showMeetLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-[#8C57FF]" />
              <h3 className="text-[#4A4A68]">Add Google Meet Link</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Meeting Link</Label>
                <Input
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This link will be shared with the student for the virtual visit
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowMeetLinkModal(null);
                  setMeetLink('');
                }}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#8C57FF] hover:bg-[#7645E8]"
                onClick={handleConfirmWithMeetLink}
                disabled={isConfirming}
              >
                {isConfirming ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming...</> : 'Confirm Visit'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
