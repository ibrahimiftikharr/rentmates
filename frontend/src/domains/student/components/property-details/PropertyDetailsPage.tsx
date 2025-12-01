import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, MapPin, BedDouble, Bath, Ruler, Calendar, Home, Users, Shield, TrendingUp, User, Check, X as XIcon, ChevronLeft, ChevronRight, Flag, DollarSign, Mail, Phone, Globe } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from '@/shared/utils/toast';
import { studentService } from '../../services/studentService';
import { visitRequestService } from '@/shared/services/visitRequestService';
import { 
  checkStudentProfile, 
  checkPropertyVisit, 
  checkHigherBids, 
  createJoinRequest 
} from '@/shared/services/joinRequestService';
import { getCurrencySymbol, formatCurrency } from '@/shared/utils/currency';

interface PropertyDetailsPageProps {
  property: any;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

interface Flatmate {
  id: number;
  name: string;
  photo: string;
  field: string;
  year: string;
  compatibility: number;
  nationality: string;
  university: string;
  bio: string;
  interests: string[];
  email: string;
  phone: string;
}

export function PropertyDetailsPage({ property, onClose, onNavigate }: PropertyDetailsPageProps) {
  // Get currency symbol for this property
  const currencySymbol = getCurrencySymbol(property.currency);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [openVisitDialog, setOpenVisitDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [visitType, setVisitType] = useState<'virtual' | 'in-person'>('virtual');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bidAmount, setBidAmount] = useState('');
  const [stayTenure, setStayTenure] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [visitCalendarMonth, setVisitCalendarMonth] = useState(new Date().getMonth());
  const [visitCalendarYear, setVisitCalendarYear] = useState(new Date().getFullYear());
  const [selectedFlatmate, setSelectedFlatmate] = useState<Flatmate | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSchedulingVisit, setIsSchedulingVisit] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [property.id]);

  const checkWishlistStatus = async () => {
    try {
      const wishlist = await studentService.getWishlist();
      setIsWishlisted(wishlist.some(p => p.id === property.id));
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await studentService.removeFromWishlist(property.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await studentService.addToWishlist(property.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  // Extract bills from property data
  const bills = [
    { name: 'WiFi', included: property.billsIncluded?.includes('WiFi') || property.billsIncluded?.includes('wifi') || false, amount: property.billPrices?.wifi || 0 },
    { name: 'Water', included: property.billsIncluded?.includes('Water') || property.billsIncluded?.includes('water') || false, amount: property.billPrices?.water || 0 },
    { name: 'Electricity', included: property.billsIncluded?.includes('Electricity') || property.billsIncluded?.includes('electricity') || false, amount: property.billPrices?.electricity || 0 },
    { name: 'Gas', included: property.billsIncluded?.includes('Gas') || property.billsIncluded?.includes('gas') || false, amount: property.billPrices?.gas || 0 },
    { name: 'Council Tax', included: property.billsIncluded?.includes('Council Tax') || property.billsIncluded?.includes('councilTax') || false, amount: property.billPrices?.councilTax || 0 },
  ];

  // Flatmates data - currently empty for new properties
  const flatmates: Flatmate[] = property.flatmates || [];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Generate calendar dates
  const generateCalendarDates = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }

    // Add actual dates
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(i);
    }

    return dates;
  };

  // Check if a date is available for viewing
  const isDateAvailable = (day: number | null, month: number, year: number) => {
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    // Only future dates or today are available
    if (date < today) return false;
    
    // Debug logging
    if (month === currentMonth && year === currentYear && property.availabilityDates) {
      console.log(`📅 Checking day ${day}:`, {
        availabilityDates: property.availabilityDates,
        dateCount: property.availabilityDates.length
      });
    }
    
    // If property has specific availability dates, check against them
    if (property.availabilityDates && property.availabilityDates.length > 0) {
      const isAvailable = property.availabilityDates.some((availDate: string | Date) => {
        const availableDate = new Date(availDate);
        availableDate.setHours(0, 0, 0, 0);
        const matches = availableDate.getDate() === day &&
               availableDate.getMonth() === month &&
               availableDate.getFullYear() === year;
        
        if (matches && month === currentMonth && year === currentYear) {
          console.log(`✅ Day ${day} matches availability date:`, availableDate);
        }
        
        return matches;
      });
      
      return isAvailable;
    }
    
    // If no specific dates, all future dates are available as fallback
    return true;
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevMonth = () => {
    const today = new Date();
    const wouldBeMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const wouldBeYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Don't go before current month
    if (wouldBeYear < today.getFullYear() || 
        (wouldBeYear === today.getFullYear() && wouldBeMonth < today.getMonth())) {
      return;
    }
    
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleJoinRequest = async () => {
    if (!bidAmount) {
      toast.error('Please enter a rent amount');
      return;
    }
    if (!moveInDate) {
      toast.error('Please select a move-in date');
      return;
    }

    // Validate move-in date is not in the past
    const selectedMoveInDate = new Date(moveInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedMoveInDate < today) {
      toast.error('Move-in date cannot be in the past. Please select a future date.');
      return;
    }

    // Check if bid is higher than listed price
    const bidValue = parseFloat(bidAmount);
    if (bidValue > property.price) {
      const proceed = confirm(
        `Your offer (${currencySymbol}${bidValue}) is higher than the listed price (${currencySymbol}${property.price}).\n\n` +
        'Are you sure you want to continue with this amount?'
      );
      if (!proceed) {
        return;
      }
    }

    try {
      // Step 1: Check profile completion
      const profileCheck = await checkStudentProfile();
      if (!profileCheck.isComplete) {
        const missing = [];
        if (profileCheck.missingFields.name) missing.push('Full Name');
        if (profileCheck.missingFields.governmentId) missing.push('Government ID');
        if (profileCheck.missingFields.idDocument) missing.push('ID Document (National ID or Passport)');
        
        toast.error(`Profile incomplete! Please add: ${missing.join(', ')}`, {
          duration: 5000
        });
        setOpenJoinDialog(false);
        return;
      }

      // Step 2: Check property visit (warning only)
      const visitCheck = await checkPropertyVisit(property.id);
      if (!visitCheck.hasVisited) {
        const proceed = confirm(
          'You haven\'t scheduled or completed a visit for this property yet. ' +
          'We recommend visiting before submitting a join request.\n\n' +
          'Do you want to continue anyway?'
        );
        if (!proceed) {
          return;
        }
      }

      // Step 3: Check higher bids (warning only)
      const bidCheck = await checkHigherBids(property.id, parseFloat(bidAmount));
      if (bidCheck.hasHigherBids) {
        const proceed = confirm(
          `The landlord has received ${bidCheck.higherBidsCount} higher bid(s). ` +
          `Highest bid: $${bidCheck.highestBid}/month.\n\n` +
          'Do you still want to submit your request?'
        );
        if (!proceed) {
          return;
        }
      }

      // Step 4: Submit join request
      await createJoinRequest({
        propertyId: property.id,
        movingDate: moveInDate,
        bidAmount: parseFloat(bidAmount),
        message: `Interested in renting for ${stayTenure} months`
      });

      setOpenJoinDialog(false);
      toast.success('Join request sent successfully!');
      
      // Navigate to join requests page if possible
      if (onNavigate) {
        setTimeout(() => onNavigate('join-requests'), 1500);
      }
    } catch (error: any) {
      console.error('Failed to submit join request:', error);
      toast.error(error.error || error.message || 'Failed to submit join request');
    }
  };

  const handleBookVisit = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a time');
      return;
    }

    setIsSchedulingVisit(true);
    try {
      await visitRequestService.createVisitRequest({
        propertyId: property.id,
        visitType,
        visitDate: selectedDate.toISOString(),
        visitTime: selectedTime,
      });
      
      setOpenVisitDialog(false);
      setSelectedDate(null);
      setSelectedTime('');
      setVisitType('virtual');
      toast.success(`${visitType === 'virtual' ? 'Virtual' : 'In-person'} visit request sent to landlord successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule visit. Please try again.');
    } finally {
      setIsSchedulingVisit(false);
    }
  };

  const handleDateClick = (day: number | null) => {
    if (day && isDateAvailable(day, currentMonth, currentYear)) {
      setSelectedDate(new Date(currentYear, currentMonth, day));
    }
  };

  const handleVisitDateClick = (day: number | null) => {
    if (day && isDateAvailable(day, visitCalendarMonth, visitCalendarYear)) {
      setSelectedDate(new Date(visitCalendarYear, visitCalendarMonth, day));
    }
  };

  const handleVisitNextMonth = () => {
    if (visitCalendarMonth === 11) {
      setVisitCalendarMonth(0);
      setVisitCalendarYear(visitCalendarYear + 1);
    } else {
      setVisitCalendarMonth(visitCalendarMonth + 1);
    }
  };

  const handleVisitPrevMonth = () => {
    const today = new Date();
    const wouldBeMonth = visitCalendarMonth === 0 ? 11 : visitCalendarMonth - 1;
    const wouldBeYear = visitCalendarMonth === 0 ? visitCalendarYear - 1 : visitCalendarYear;
    
    // Don't go before current month
    if (wouldBeYear < today.getFullYear() || 
        (wouldBeYear === today.getFullYear() && wouldBeMonth < today.getMonth())) {
      return;
    }
    
    if (visitCalendarMonth === 0) {
      setVisitCalendarMonth(11);
      setVisitCalendarYear(visitCalendarYear - 1);
    } else {
      setVisitCalendarMonth(visitCalendarMonth - 1);
    }
  };

  // If viewing flatmate profile, show that instead
  if (selectedFlatmate) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedFlatmate(null)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Property
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Profile Header */}
          <Card className="shadow-xl border-2 mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-xl">
                    <AvatarImage src={selectedFlatmate.photo} className="object-cover" />
                    <AvatarFallback className="text-2xl">
                      {selectedFlatmate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="mb-3">{selectedFlatmate.name}</h1>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <BedDouble className="w-5 h-5" />
                      <span>{selectedFlatmate.field} • {selectedFlatmate.year}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Home className="w-5 h-5" />
                      <span>{selectedFlatmate.university}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Globe className="w-5 h-5" />
                      <span>{selectedFlatmate.nationality}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                      <Heart className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-semibold text-primary">{selectedFlatmate.compatibility}% Match</span>
                    </div>
                    <Button 
                      className="gap-2"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('messages');
                        }
                        onClose();
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card className="shadow-lg border-2 mb-6">
            <CardContent className="p-6">
              <h2 className="mb-4">About Me</h2>
              <p className="text-gray-600 leading-relaxed">{selectedFlatmate.bio}</p>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="shadow-lg border-2 mb-6">
            <CardContent className="p-6">
              <h2 className="mb-4">Interests & Hobbies</h2>
              <div className="flex flex-wrap gap-3">
                {selectedFlatmate.interests.map((interest, index) => (
                  <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 text-sm border border-primary/20">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-lg border-2">
            <CardContent className="p-6">
              <h2 className="mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedFlatmate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedFlatmate.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="gap-2 px-2 sm:px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Search</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="gap-2 px-2 sm:px-4">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`gap-2 px-2 sm:px-4 ${isWishlisted ? 'text-red-500 border-red-500' : ''}`}
              onClick={toggleWishlist}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isWishlisted ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 mb-4">
            <img 
              src={property.images[currentImageIndex]} 
              alt={`Property view ${currentImageIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />
            
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>

          {/* Thumbnail Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {property.images.map((image: string, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Location */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{property.address}</span>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                  Available Now
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-gray-600 border-y py-4 my-4">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5" />
                  <span>{property.bedrooms || 0} Bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5" />
                  <span>{property.bathrooms || 0} Bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                </div>
                {property.area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    <span>{property.area} sq ft</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{flatmates.length} Flatmate{flatmates.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Tabs for Different Sections */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="amenities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Amenities
                </TabsTrigger>
                <TabsTrigger value="bills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Bills & Costs
                </TabsTrigger>
                <TabsTrigger value="flatmates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Flatmates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Description */}
                <div>
                  <h2 className="mb-3">About This Property</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {property.description || "Beautiful student accommodation in a prime location. Perfect for students looking for a comfortable and convenient living space. Close to universities, public transport, and local amenities. The property features modern furnishings and all essential facilities for a comfortable student life."}
                  </p>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Property Type</p>
                    <p className="font-medium capitalize">{property.type}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Furnishing</p>
                    <p className="font-medium">{property.furnished ? 'Fully Furnished' : 'Unfurnished'}</p>
                  </div>
                  {property.minimumStay && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Min Stay</p>
                      <p className="font-medium">{property.minimumStay} month{property.minimumStay !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {property.maximumStay && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Max Stay</p>
                      <p className="font-medium">{property.maximumStay} month{property.maximumStay !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>

                {/* House Rules */}
                <div>
                  <h3 className="mb-4">House Rules</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`border rounded-lg p-4 text-center ${property.houseRules?.petsAllowed ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {property.houseRules?.petsAllowed ? (
                        <Check className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                      ) : (
                        <XIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className={`text-sm font-medium ${property.houseRules?.petsAllowed ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {property.houseRules?.petsAllowed ? 'Pets Allowed' : 'No Pets'}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 text-center ${property.houseRules?.smokingAllowed ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {property.houseRules?.smokingAllowed ? (
                        <Check className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                      ) : (
                        <XIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className={`text-sm font-medium ${property.houseRules?.smokingAllowed ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {property.houseRules?.smokingAllowed ? 'Smoking Allowed' : 'No Smoking'}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 text-center ${property.houseRules?.guestsAllowed !== false ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {property.houseRules?.guestsAllowed !== false ? (
                        <Check className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                      ) : (
                        <XIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className={`text-sm font-medium ${property.houseRules?.guestsAllowed !== false ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {property.houseRules?.guestsAllowed !== false ? 'Guests Welcome' : 'No Guests'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="mt-6">
                <h3 className="mb-4">Included Amenities</h3>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {property.amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No amenities listed for this property</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bills" className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-4">Monthly Bills Breakdown</h3>
                  <div className="space-y-3">
                    {bills.map((bill, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <span className="font-medium">{bill.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">{currencySymbol}{bill.amount}/mo</span>
                          {bill.included ? (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Included</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">Not Included</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Cost Summary Card */}
                  <Card className="mt-6 shadow-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
                    <CardContent className="p-6">
                      <h4 className="mb-4 text-primary flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Monthly Cost Breakdown
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Base Rent with Included Bills */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">Base Rent with Included Bills</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Includes: {bills.filter(b => b.included).map(b => b.name).join(', ')}
                            </p>
                          </div>
                          <p className="text-2xl font-semibold text-gray-900">
                            {currencySymbol}{property.price}
                          </p>
                        </div>

                        {/* Excluded Bills */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                          <div>
                            <p className="font-medium text-amber-700">Excluded Bills (Pay Separately)</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {bills.filter(b => !b.included).map(b => `${b.name} (${currencySymbol}${b.amount})`).join(', ')}
                            </p>
                          </div>
                          <p className="text-2xl font-semibold text-amber-700">
                            {currencySymbol}{bills.filter(b => !b.included).reduce((sum, b) => sum + b.amount, 0)}
                          </p>
                        </div>

                        {/* Total Estimated Monthly Cost */}
                        <div className="flex items-center justify-between pt-2 bg-primary/10 -mx-6 px-6 py-4 rounded-lg">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">Total Estimated Monthly Cost</p>
                            <p className="text-sm text-gray-600 mt-1">Base rent + all bills</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary">
                              {currencySymbol}{property.price + bills.filter(b => !b.included).reduce((sum, b) => sum + b.amount, 0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">per month</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p>
                            <span className="font-medium">Note:</span> Included bills ({currencySymbol}{bills.filter(b => b.included).reduce((sum, b) => sum + b.amount, 0)}) are already covered in your base rent. 
                            You'll need to pay excluded bills separately to utility providers.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rent Insights */}
                <div className="border rounded-lg p-6">
                  <h3 className="mb-4">Rent Insights</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Listed Price</p>
                      <p className="text-2xl font-semibold text-blue-900">{currencySymbol}{property.price}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Area Average</p>
                      <p className="text-2xl font-semibold text-slate-900">{currencySymbol}{property.price + 50}</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">You Save</p>
                      <p className="text-2xl font-semibold text-emerald-700">{currencySymbol}50</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="flatmates" className="mt-6 space-y-6">
                {flatmates.length > 0 ? (
                  <>
                    <h3 className="mb-6">Current Flatmates ({flatmates.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {flatmates.map((flatmate) => (
                        <Card key={flatmate.id} className="shadow-xl hover:shadow-2xl transition-all border-2 hover:border-primary/50">
                          <CardContent className="p-6">
                            {/* Profile Photo - Centered and Large */}
                            <div className="flex flex-col items-center mb-5">
                              <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-4 ring-primary/10 mb-4">
                                <AvatarImage src={flatmate.photo} className="object-cover" />
                                <AvatarFallback className="text-xl">
                                  {flatmate.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Match Badge */}
                              <div className="bg-primary/10 px-4 py-2 rounded-full mb-3">
                                <div className="flex items-center gap-2">
                                  <Heart className="w-4 h-4 text-primary fill-primary" />
                                  <span className="font-semibold text-primary">{flatmate.compatibility}% Match</span>
                                </div>
                              </div>
                              
                              {/* Name and Basic Info */}
                              <h3 className="text-center mb-1">{flatmate.name}</h3>
                              <p className="text-sm text-gray-600 text-center">{flatmate.field}</p>
                              <p className="text-xs text-gray-500 text-center">{flatmate.year}</p>
                            </div>

                            {/* Nationality */}
                            <div className="flex items-center justify-center gap-2 mb-5 p-3 bg-gray-50 rounded-lg">
                              <Globe className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">{flatmate.nationality}</span>
                            </div>

                            {/* Compatibility Progress */}
                            <div className="mb-5">
                              <div className="flex items-center justify-between mb-2 text-sm">
                                <span className="text-gray-600">Compatibility Score</span>
                                <span className="font-semibold">{flatmate.compatibility}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-500"
                                  style={{ width: `${flatmate.compatibility}%` }}
                                />
                              </div>
                            </div>

                            {/* View Profile Button */}
                            <Button 
                              variant="outline" 
                              className="w-full border-2 hover:border-primary hover:bg-primary/5" 
                              size="lg"
                              onClick={() => setSelectedFlatmate(flatmate)}
                            >
                              View Full Profile
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">AI Compatibility Matching</h4>
                          <p className="text-sm text-blue-700">
                            Our algorithm analyzes lifestyle, study habits, and preferences to calculate compatibility scores.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Currently Living Here</h3>
                    <p className="text-gray-500">This property doesn't have any current tenants yet. Be the first to move in!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Landlord Section */}
            {property.landlord && (
              <div className="rounded-2xl p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-all duration-300 border-0">
                <h3 className="mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Landlord Information
                </h3>
                <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-2 ring-primary/20">
                      <AvatarImage src={property.landlord.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'} />
                      <AvatarFallback>{property.landlord.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'LL'}</AvatarFallback>
                    </Avatar>
                    {property.landlord.reputationScore >= 80 && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg">{property.landlord.user?.name || 'Landlord'}</h4>
                      {property.landlord.reputationScore >= 80 && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Reputation Score</p>
                          <p className="font-semibold text-primary text-lg">{property.landlord.reputationScore || 0}/100</p>
                        </div>
                      </div>

                      {property.landlord.user?.email !== null ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <p className="text-xs text-gray-600">Email</p>
                            {property.landlord.user.email ? (
                              <p className="font-medium text-gray-900 truncate text-sm">{property.landlord.user.email}</p>
                            ) : (
                              <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                          </div>
                        </div>
                      )}

                      {property.landlord.phone !== null ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Phone</p>
                            {property.landlord.phone ? (
                              <p className="font-medium text-gray-900">{property.landlord.phone}</p>
                            ) : (
                              <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Phone</p>
                            <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                          </div>
                        </div>
                      )}

                      {property.landlord.nationality !== null ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Flag className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Nationality</p>
                            {property.landlord.nationality ? (
                              <p className="font-medium text-gray-900">{property.landlord.nationality}</p>
                            ) : (
                              <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Flag className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Nationality</p>
                            <p className="text-sm italic text-gray-500">Landlord prefers not to disclose</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => onNavigate && onNavigate('messages')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Message Landlord
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <p className="text-3xl font-semibold mb-1">{currencySymbol}{property.price}<span className="text-lg text-gray-500 font-normal">/month</span></p>
                    <p className="text-sm text-gray-600">+ {currencySymbol}{property.deposit || (property.price * 1)} security deposit</p>
                  </div>

                  {/* Move in By */}
                  {(property.moveInBy || property.availableFrom) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-purple-100 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-gray-900">
                          {property.moveInBy ? 'Move in By' : 'Available From'}
                        </h4>
                      </div>
                      <p className="text-2xl font-semibold text-primary">
                        {new Date(property.moveInBy || property.availableFrom).toLocaleDateString('en-US', { 
                          day: 'numeric',
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {property.moveInBy ? 'Deadline for moving in' : 'Property available from this date'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      className="w-full h-12 bg-primary hover:bg-primary/90"
                      onClick={() => setOpenJoinDialog(true)}
                    >
                      Request to Join
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-12"
                      onClick={() => setOpenVisitDialog(true)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Visit
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                      onClick={() => setOpenLoanDialog(true)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Apply for Student Loan
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                      onClick={() => setOpenReportDialog(true)}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Available Dates</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevMonth}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-700 mb-4 text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </p>
                  
                  {/* Day names header */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayNames.map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDates(currentMonth, currentYear).map((day, index) => {
                      const isAvailable = isDateAvailable(day, currentMonth, currentYear);
                      const isSelected = selectedDate && 
                        day === selectedDate.getDate() && 
                        currentMonth === selectedDate.getMonth() &&
                        currentYear === selectedDate.getFullYear();
                      
                      return (
                        <button
                          key={index}
                          disabled={!isAvailable}
                          onClick={() => handleDateClick(day)}
                          className={`
                            aspect-square p-2 rounded-lg text-sm transition-all flex items-center justify-center
                            ${!day ? 'cursor-default' : ''}
                            ${isSelected ? 'bg-primary text-white font-semibold' : ''}
                            ${isAvailable && !isSelected
                              ? 'bg-slate-100 text-slate-900 hover:bg-primary hover:text-white cursor-pointer' 
                              : ''
                            }
                            ${day && !isAvailable && !isSelected ? 'text-gray-300 cursor-not-allowed' : ''}
                          `}
                        >
                          {day || ''}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-100 border" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary" />
                      <span>Selected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-3 transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <XIcon className="w-6 h-6" />
          </button>
          <img 
            src={property.images[currentImageIndex]} 
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Join Request Dialog */}
      <Dialog open={openJoinDialog} onOpenChange={setOpenJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join</DialogTitle>
            <DialogDescription>
              Submit your application to join this property
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bid">Your Monthly Rent Offer ({currencySymbol})</Label>
              <Input
                id="bid"
                type="number"
                min="0"
                placeholder={`Listed price: ${currencySymbol}${property.price}`}
                value={bidAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setBidAmount(val);
                  }
                }}
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tenure">Stay Tenure (months)</Label>
              <Input 
                id="tenure" 
                type="number" 
                placeholder="e.g., 12"
                value={stayTenure}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseFloat(val) >= 1 && parseFloat(val) <= 24)) {
                    setStayTenure(val);
                  }
                }}
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                min="1"
                max="24"
              />
              <p className="text-xs text-gray-500">Minimum 3 months, maximum 24 months</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveIn">Preferred Move-in Date</Label>
              <Input 
                id="moveIn" 
                type="date" 
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">Must be a future date</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border">
              <p className="text-sm text-gray-600">
                The landlord will review your application and contact you within 24 hours.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Dialog */}
      <Dialog open={openVisitDialog} onOpenChange={setOpenVisitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Schedule a Visit</DialogTitle>
            <DialogDescription>
              Choose your preferred visit type, date, and time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Visit Type */}
            <div className="space-y-2">
              <Label>Visit Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setVisitType('virtual')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    visitType === 'virtual' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium mb-1">Virtual Visit</p>
                  <p className="text-sm text-gray-600">Video tour</p>
                </button>
                <button
                  onClick={() => setVisitType('in-person')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    visitType === 'in-person' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium mb-1">In-Person</p>
                  <p className="text-sm text-gray-600">Physical visit</p>
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <div className="border-2 rounded-lg p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVisitPrevMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">
                    {monthNames[visitCalendarMonth]} {visitCalendarYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVisitNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <div key={`day-${index}`} className="flex items-center justify-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {generateCalendarDates(visitCalendarMonth, visitCalendarYear).map((day, index) => {
                    const available = isDateAvailable(day, visitCalendarMonth, visitCalendarYear);
                    const isSelected = selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === visitCalendarMonth &&
                      selectedDate.getFullYear() === visitCalendarYear;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleVisitDateClick(day)}
                        disabled={!available}
                        className={`
                          aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                          ${!day ? 'invisible' : ''}
                          ${available ? 'hover:bg-primary/10 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}
                          ${isSelected ? 'bg-primary text-white hover:bg-primary' : ''}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="visit-time">Visit Time (UTC)</Label>
              <select
                id="visit-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="">Select a time</option>
                <option value="08:00">08:00 UTC (Morning)</option>
                <option value="09:00">09:00 UTC</option>
                <option value="10:00">10:00 UTC</option>
                <option value="11:00">11:00 UTC</option>
                <option value="12:00">12:00 UTC (Noon)</option>
                <option value="13:00">13:00 UTC</option>
                <option value="14:00">14:00 UTC (Afternoon)</option>
                <option value="15:00">15:00 UTC</option>
                <option value="16:00">16:00 UTC</option>
                <option value="17:00">17:00 UTC</option>
                <option value="18:00">18:00 UTC (Evening)</option>
                <option value="19:00">19:00 UTC</option>
                <option value="20:00">20:00 UTC</option>
              </select>
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && (
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <p className="font-medium text-primary mb-2">Visit Summary</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Type:</span> {visitType === 'virtual' ? 'Virtual Visit' : 'In-Person Visit'}</p>
                  <p><span className="text-gray-600">Date:</span> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p><span className="text-gray-600">Time:</span> {selectedTime} UTC</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenVisitDialog(false)} disabled={isSchedulingVisit}>
              Cancel
            </Button>
            <Button onClick={handleBookVisit} disabled={isSchedulingVisit}>
              {isSchedulingVisit ? 'Scheduling...' : 'Schedule Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={openReportDialog} onOpenChange={setOpenReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              Help us maintain quality by reporting issues
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for reporting</Label>
              <select id="reason" className="w-full p-2 border rounded-lg">
                <option>Inaccurate information</option>
                <option>Fraudulent listing</option>
                <option>Inappropriate content</option>
                <option>Already rented</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional details</Label>
              <Textarea id="details" placeholder="Describe the issue..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setOpenReportDialog(false);
              toast.success('Report submitted. Thank you for your feedback.');
            }}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={openLoanDialog} onOpenChange={setOpenLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Loan Application</DialogTitle>
            <DialogDescription>
              Quick pre-approval for student housing loans
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                Get instant pre-approval for loans up to {currencySymbol}10,000 to cover rent and deposits.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount ({currencySymbol})</Label>
              <Input 
                id="amount" 
                type="number" 
                min="0"
                placeholder="Enter amount needed" 
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input id="university" placeholder="Your university name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLoanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setOpenLoanDialog(false);
              toast.success('Loan application submitted for review.');
            }}>
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
