import { useState } from 'react';
import { Calendar as CalendarIcon, Video, MapPin, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

export function AvailabilityBookingSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [openVisitDialog, setOpenVisitDialog] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [visitType, setVisitType] = useState<'virtual' | 'in-person' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [visitRequested, setVisitRequested] = useState(false);

  const handleBookVisit = () => {
    setOpenVisitDialog(true);
  };

  const handleVisitTypeSelect = (type: 'virtual' | 'in-person') => {
    setVisitType(type);
    setOpenVisitDialog(false);
    setOpenDatePicker(true);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setOpenDatePicker(false);
      setOpenConfirmation(true);
    }
  };

  const handleConfirmVisit = () => {
    setOpenConfirmation(false);
    setVisitRequested(true);
    toast.success("Your visit request has been sent to the landlord. You'll be notified once it's confirmed.");
  };

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

  // Only allow selection of available dates
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

  const modifiersClassNames = {
    available: 'hover:bg-primary hover:text-white transition-colors cursor-pointer',
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b bg-card">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Availability & Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {/* Calendar */}
          <div>
            <h3 className="text-center mb-6">Property Availability Calendar</h3>
            <div className="max-w-2xl mx-auto bg-muted/30 p-8 rounded-xl border border-border">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={disabledDates}
                  className="rounded-md scale-110"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  modifiersClassNames={modifiersClassNames}
                />
              </div>
              <div className="flex justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#86efac]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Button */}
          <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="mb-1">Schedule a Property Visit</h3>
                <p className="text-sm text-muted-foreground">
                  Choose between virtual or in-person viewing
                </p>
              </div>
            </div>
            
            {visitRequested ? (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-green-100 border-2 border-green-500">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Visit Request Sent</p>
                  <p className="text-sm text-green-700">
                    {visitType === 'virtual' ? 'Virtual' : 'In-person'} visit on {selectedDate?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full bg-primary hover:bg-primary/90 h-12"
                onClick={handleBookVisit}
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Book Visit
              </Button>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border-2 border-border bg-muted/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Virtual Visit</h4>
                  <p className="text-sm text-muted-foreground">
                    Join a live video tour from anywhere, ask questions in real-time
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border-2 border-border bg-muted/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">In-Person Visit</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the property physically, meet the landlord and current tenants
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Type Selection Dialog */}
      <Dialog open={openVisitDialog} onOpenChange={setOpenVisitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Visit Type</DialogTitle>
            <DialogDescription>
              Select how you would like to view the property
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <button
              onClick={() => handleVisitTypeSelect('virtual')}
              className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Virtual Visit</h4>
                  <p className="text-sm text-muted-foreground">
                    Live video tour with the landlord
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleVisitTypeSelect('in-person')}
              className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">In-Person Visit</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the property in person
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
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
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
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
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                The landlord will be notified of your request and will confirm the exact time shortly.
              </p>
            </div>
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
    </>
  );
}
