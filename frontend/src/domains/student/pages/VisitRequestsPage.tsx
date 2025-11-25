import { useState, useEffect } from 'react';
import { CalendarCheck, Video, MapPin, Clock, ExternalLink, User, Home, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { visitRequestService, VisitRequest as VisitRequestType } from '@/shared/services/visitRequestService';
import { socketService } from '@/shared/services/socketService';
import { toast } from 'sonner';

interface VisitRequest {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  visitType: 'virtual' | 'in-person';
  status: 'pending' | 'confirmed' | 'completed' | 'rescheduled' | 'rejected';
  requestDate: string;
  scheduledDate?: string;
  scheduledTime?: string;
  meetingLink?: string;
  rejectionReason?: string;
  landlordNotes?: string;
}

export function VisitRequestsPage() {
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'confirmed' | 'pending' | 'completed'>('confirmed');

  useEffect(() => {
    fetchVisitRequests();

    // Listen for real-time updates
    socketService.on('visit_confirmed', () => {
      fetchVisitRequests();
    });

    socketService.on('visit_rescheduled', () => {
      fetchVisitRequests();
    });

    socketService.on('visit_rejected', () => {
      fetchVisitRequests();
    });

    return () => {
      socketService.off('visit_confirmed');
      socketService.off('visit_rescheduled');
      socketService.off('visit_rejected');
    };
  }, []);

  const fetchVisitRequests = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching student visit requests...');
      const response = await visitRequestService.getStudentVisitRequests();
      console.log('Received visit requests:', response);
      
      // Transform backend data to match UI structure
      const transformedRequests: VisitRequest[] = response.map((request: VisitRequestType) => {
        console.log('Transforming request:', request);
        return {
          id: request._id,
          propertyTitle: request.property?.title || 'Property',
          propertyAddress: request.property?.location || request.property?.address || 'Address not available',
          landlordName: request.landlord?.fullName || request.landlord?.user?.name || 'Landlord',
          visitType: request.visitType,
          status: request.status as any,
          requestDate: new Date(request.createdAt).toLocaleDateString(),
          scheduledDate: request.visitDate ? new Date(request.visitDate).toLocaleDateString() : undefined,
          scheduledTime: request.visitTime,
          meetingLink: request.meetLink,
          rejectionReason: request.rejectionReason,
          landlordNotes: request.landlordNotes,
        };
      });

      console.log('Transformed requests:', transformedRequests);
      setVisitRequests(transformedRequests);
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
        return 'bg-yellow-500';
      case 'confirmed':
      case 'rescheduled':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const pendingRequests = visitRequests.filter(r => r.status === 'pending');
  const confirmedRequests = visitRequests.filter(r => r.status === 'confirmed' || r.status === 'rescheduled');
  const completedRequests = visitRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  const VisitCard = ({ visit }: { visit: VisitRequest }) => (
    <Card className="hover:shadow-2xl transition-shadow shadow-lg border-2">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="mb-2">{visit.propertyTitle}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span>{visit.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Landlord: {visit.landlordName}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(visit.status)} text-white`}>
            {getStatusText(visit.status)}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            {visit.visitType === 'virtual' ? (
              <>
                <Video className="w-4 h-4 text-blue-500" />
                <span>Virtual Visit</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>In-Person Visit</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck className="w-4 h-4" />
            <span>Requested: {new Date(visit.requestDate).toLocaleDateString()}</span>
          </div>

          {visit.status === 'confirmed' && visit.scheduledDate && (
            <>
              <Separator className="my-3" />
              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                  <Clock className="w-4 h-4" />
                  <span>Scheduled for: {new Date(visit.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-green-800 ml-6">
                  Time: {visit.scheduledTime}
                </div>
                {visit.landlordNotes && (
                  <div className="mt-2 p-2 rounded bg-white border border-green-300 text-sm text-green-900">
                    <span className="font-medium">Landlord Note:</span> {visit.landlordNotes}
                  </div>
                )}
                {visit.visitType === 'virtual' && visit.meetingLink && (
                  <Button
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(visit.meetingLink, '_blank')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {visit.visitType === 'in-person' && (
                  <div className="mt-3 p-3 rounded bg-white border border-green-300">
                    <div className="flex items-start gap-2 text-sm text-green-900">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium mb-1">Meeting Location:</div>
                        <div>{visit.propertyAddress}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {visit.status === 'rescheduled' && visit.scheduledDate && (
            <>
              <Separator className="my-3" />
              <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <Clock className="w-4 h-4" />
                  <span>Rescheduled to: {new Date(visit.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-amber-800 ml-6">
                  Time: {visit.scheduledTime}
                </div>
                {visit.landlordNotes && (
                  <div className="mt-2 p-2 rounded bg-white border border-amber-300 text-sm text-amber-900">
                    <span className="font-medium">Landlord Note:</span> {visit.landlordNotes}
                  </div>
                )}
                {visit.visitType === 'virtual' && visit.meetingLink && (
                  <Button
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(visit.meetingLink, '_blank')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}

          {visit.status === 'completed' && visit.scheduledDate && (
            <>
              <Separator className="my-3" />
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                <div className="font-medium mb-1">Visit Completed</div>
                <div className="text-blue-700">
                  Visited on {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                </div>
              </div>
            </>
          )}

          {visit.status === 'rejected' && (
            <>
              <Separator className="my-3" />
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
                <div className="font-medium mb-1">Visit Request Declined</div>
                {visit.rejectionReason && (
                  <div className="text-red-700 mt-1">Reason: {visit.rejectionReason}</div>
                )}
              </div>
            </>
          )}

          {visit.status === 'pending' && (
            <>
              <Separator className="my-3" />
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-900">
                <div className="font-medium">Waiting for landlord confirmation</div>
                <div className="text-yellow-700 mt-1">You'll be notified once the visit is confirmed</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Visit Requests</h1>
          <p className="text-muted-foreground">
            Manage all your property visit requests
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
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
                <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                <p className="text-2xl">{confirmedRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-green-600" />
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
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setSelectedTab('confirmed')}
          variant={selectedTab === 'confirmed' ? 'default' : 'outline'}
          className={`${selectedTab === 'confirmed' ? 'bg-primary' : ''}`}
        >
          <CalendarCheck className="w-4 h-4 mr-2" />
          Upcoming Visits
          {confirmedRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{confirmedRequests.length}</Badge>
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
          onClick={() => setSelectedTab('completed')}
          variant={selectedTab === 'completed' ? 'default' : 'outline'}
          className={`${selectedTab === 'completed' ? 'bg-primary' : ''}`}
        >
          <Home className="w-4 h-4 mr-2" />
          Past Visits
          {completedRequests.length > 0 && (
            <Badge className="ml-2 bg-white text-primary">{completedRequests.length}</Badge>
          )}
        </Button>
      </div>

      {/* Confirmed Visits */}
      {selectedTab === 'confirmed' && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : confirmedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {confirmedRequests.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Upcoming Visits</h3>
              <p className="text-muted-foreground">
                You don't have any confirmed visits scheduled
              </p>
            </Card>
          )}
        </>
      )}

      {/* Pending Visits */}
      {selectedTab === 'pending' && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                You don't have any requests waiting for confirmation
              </p>
            </Card>
          )}
        </>
      )}

      {/* Completed Visits */}
      {selectedTab === 'completed' && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : completedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedRequests.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center shadow-lg">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No Past Visits</h3>
              <p className="text-muted-foreground">
                You haven't completed any property visits yet
              </p>
            </Card>
          )}
        </>
      )}

      {!isLoading && visitRequests.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2">No Visit Requests</h3>
          <p className="text-muted-foreground mb-6">
            You haven't requested any property visits yet
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            Browse Properties
          </Button>
        </Card>
      )}
    </div>
  );
}
