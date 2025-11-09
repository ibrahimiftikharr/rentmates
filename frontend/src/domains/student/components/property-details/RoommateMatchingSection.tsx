import { useState } from 'react';
import { Users, Eye, Heart, UserPlus, Calendar, Send, Video, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Calendar as CalendarComponent } from '@/shared/ui/calendar';
import { toast } from 'sonner';

export function RoommateMatchingSection() {
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [openVisitPrompt, setOpenVisitPrompt] = useState(false);
  const [openVisitTypeDialog, setOpenVisitTypeDialog] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [hasVisited] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [visitType, setVisitType] = useState<'virtual' | 'in-person' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const flatmates = [
    {
      id: 1,
      name: 'Sarah Johnson',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYyMzYxNzI0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      field: 'Computer Science',
      tagline: 'Love coding and late-night study sessions!',
      compatibility: 92,
    },
    {
      id: 2,
      name: 'Emma Wilson',
      photo: 'https://images.unsplash.com/photo-1631128869897-68e78bf4fb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHNtaWxpbmd8ZW58MXx8fHwxNzYyNDUyMzk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      field: 'Business Management',
      tagline: 'Organized, clean, and friendly roommate',
      compatibility: 87,
    },
    {
      id: 3,
      name: 'Alex Chen',
      photo: 'https://images.unsplash.com/photo-1568880893176-fb2bdab44e41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudCUyMHByb2ZpbGV8ZW58MXx8fHwxNzYyNDUyMzk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      field: 'Engineering',
      tagline: 'Quiet, respectful, love cooking together',
      compatibility: 79,
    },
  ];

  // Mock available dates
  const today = new Date();
  const availableDates = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23),
  ];

  const disabledDates = (date: Date) => {
    return !availableDates.some(
      availableDate => 
        availableDate.getDate() === date.getDate() &&
        availableDate.getMonth() === date.getMonth() &&
        availableDate.getFullYear() === date.getFullYear()
    );
  };

  const modifiers = {
    available: availableDates,
  };

  const modifiersStyles = {
    available: {
      backgroundColor: '#86efac',
      color: '#166534',
      borderRadius: '6px',
      fontWeight: '500',
    },
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const handleJoinAsTenant = () => {
    if (!hasVisited) {
      setOpenVisitPrompt(true);
    } else {
      setOpenJoinDialog(true);
    }
  };

  const handleSkipVisit = () => {
    setOpenVisitPrompt(false);
    setOpenJoinDialog(true);
  };

  const handleRequestVisit = () => {
    setOpenVisitPrompt(false);
    setOpenVisitTypeDialog(true);
  };

  const handleVisitTypeSelect = (type: 'virtual' | 'in-person') => {
    setVisitType(type);
    setOpenVisitTypeDialog(false);
    setOpenDatePicker(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setOpenDatePicker(false);
      setOpenConfirmation(true);
    }
  };

  const handleConfirmVisit = () => {
    setOpenConfirmation(false);
    toast.success("Your visit request has been sent to the landlord. You'll be notified once it's confirmed.");
  };

  const handleSubmitBid = () => {
    if (!bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }
    setOpenJoinDialog(false);
    setRequestSent(true);
    toast.success('Join request sent successfully!');
  };

  return (
    <>
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Current Flatmates
            </CardTitle>
            {requestSent ? (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-lg">
                <Send className="w-5 h-5 mr-2" />
                Request Sent
              </Badge>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all h-14 px-8 text-lg"
                onClick={handleJoinAsTenant}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Join as Tenant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-muted-foreground text-lg">
            Meet your potential flatmates and check your compatibility score
          </p>

          {/* Flatmate Cards - Improved with shadow and elevation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {flatmates.map((flatmate) => (
              <Card 
                key={flatmate.id}
                className="shadow-xl hover:shadow-2xl transition-all border-2 hover:border-primary/50"
              >
                <CardContent className="p-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative mb-4">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-2 ring-primary/20">
                        <AvatarImage src={flatmate.photo} alt={flatmate.name} />
                        <AvatarFallback>{flatmate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {/* Compatibility Badge */}
                      <div className={`absolute -bottom-2 -right-2 ${getCompatibilityColor(flatmate.compatibility)} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1`}>
                        <Heart className="w-4 h-4 fill-white" />
                        {flatmate.compatibility}%
                      </div>
                    </div>
                    
                    <h3 className="text-center mb-1">{flatmate.name}</h3>
                    <p className="text-sm text-muted-foreground text-center">{flatmate.field}</p>
                  </div>

                  {/* Tagline */}
                  <Card className="mb-4 border-2 bg-gradient-to-br from-muted/50 to-muted/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-center italic">"{flatmate.tagline}"</p>
                    </CardContent>
                  </Card>

                  {/* Compatibility Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-muted-foreground font-medium">Compatibility</span>
                      <span className="font-semibold text-lg">{flatmate.compatibility}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${getCompatibilityColor(flatmate.compatibility)} transition-all duration-500 shadow-md`}
                        style={{ width: `${flatmate.compatibility}%` }}
                      />
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button variant="outline" className="w-full border-2 hover:border-primary hover:bg-primary/5" size="lg">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-blue-500/10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="mb-2">Why Compatibility Matters</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AI analyzes study habits, lifestyle preferences, and personality traits to calculate compatibility scores. Higher scores mean you're more likely to get along well and create a harmonious living environment!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Visit Prompt Dialog */}
      <Dialog open={openVisitPrompt} onOpenChange={setOpenVisitPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visit Before Joining?</DialogTitle>
            <DialogDescription>
              You haven't visited this property yet. Would you like to schedule a visit before sending your join request?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardContent className="p-4">
                <p className="text-sm text-amber-900">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  We highly recommend visiting the property first to ensure it meets your expectations.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleSkipVisit}>
              Skip & Continue
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleRequestVisit}>
              Request Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Type Selection Dialog */}
      <Dialog open={openVisitTypeDialog} onOpenChange={setOpenVisitTypeDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Choose Visit Type</DialogTitle>
            <DialogDescription>
              Select how you would like to view the property
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <button
              onClick={() => handleVisitTypeSelect('virtual')}
              className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left shadow-md hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="mb-1">Virtual Visit</h3>
                  <p className="text-sm text-muted-foreground">
                    Live video tour with the landlord from anywhere
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleVisitTypeSelect('in-person')}
              className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left shadow-md hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="mb-1">In-Person Visit</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit the property physically and meet everyone
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={openDatePicker} onOpenChange={setOpenDatePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Visit Date</DialogTitle>
            <DialogDescription>
              Choose an available date for your {visitType} visit
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              className="rounded-md border-2"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              modifiersClassNames={{
                available: 'hover:bg-primary hover:text-white transition-colors cursor-pointer',
              }}
            />
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#86efac]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>Selected</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmation} onOpenChange={setOpenConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Visit Request</DialogTitle>
            <DialogDescription>
              Please review your visit details before submitting
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card className="border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visit Type:</span>
                  <Badge className="bg-primary text-white">
                    {visitType === 'virtual' ? 'Virtual Visit' : 'In-Person Visit'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selected Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-900">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  The landlord will be notified and will confirm the exact time shortly.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmation(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleConfirmVisit}>
              Confirm Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bid Amount Dialog */}
      <Dialog open={openJoinDialog} onOpenChange={setOpenJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join as Tenant</DialogTitle>
            <DialogDescription>
              Enter your monthly rent bid to submit your application
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bid">Your Monthly Rent Bid (£)</Label>
              <Input 
                id="bid" 
                type="number" 
                placeholder="Enter amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="border-2"
              />
            </div>
            <Card className="border-2 bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  The current listed price is £800/month. You can bid the same or a different amount.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenJoinDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmitBid}>
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
