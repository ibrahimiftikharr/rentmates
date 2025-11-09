import { useState } from 'react';
import { 
  Home, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Upload, 
  Calendar as CalendarIcon,
  Check,
  Plus,
  X,
  Edit,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card } from '@/shared/ui/card';
import { Calendar } from '@/shared/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

const STEPS = [
  { id: 1, title: 'Property Details', description: 'Basic information' },
  { id: 2, title: 'Amenities', description: 'Features & facilities' },
  { id: 3, title: 'Upload Photos', description: 'Property images' },
  { id: 4, title: 'Bills & Costs', description: 'Utilities & expenses' },
  { id: 5, title: 'Availability', description: 'Visit schedule' },
  { id: 6, title: 'Review & Publish', description: 'Final review' }
];

const AMENITIES = [
  'WiFi', 'Heating', 'Air Conditioning', 'Dishwasher', 'Washing Machine',
  'Dryer', 'Study Desk', 'Gym Access', 'Parking', 'Garden', 'Balcony',
  'Storage Space', 'TV', 'Microwave', 'Oven', 'Fridge/Freezer'
];

interface PropertyData {
  title: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  flatmates: string;
  rent: string;
  deposit: string;
  minStay: string;
  maxStay: string;
  availableBy: Date | undefined;
  description: string;
  furnishing: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  guestsAllowed: boolean;
  amenities: string[];
  customAmenities: string[];
  photos: { url: string; caption: string }[];
  bills: {
    wifi: { included: boolean; amount: string };
    water: { included: boolean; amount: string };
    electricity: { included: boolean; amount: string };
    gas: { included: boolean; amount: string };
    councilTax: { included: boolean; amount: string };
  };
  availability: Date[];
}

interface AddPropertyPageProps {
  onPublish: () => void;
  onNavigate?: (page: string) => void;
}

// Mock profile data - in real app this would come from a context or API
const checkProfileComplete = () => {
  // Simulating profile check - check if basic required fields are filled
  // TO TEST: Change any of these values to empty string (e.g., firstName: '') 
  // to see the profile incomplete warning
  const profile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    nationality: 'us'
  };
  
  return !!(profile.firstName && profile.lastName && profile.email && profile.phone && profile.nationality);
};

export function AddPropertyPage({ onPublish, onNavigate }: AddPropertyPageProps) {
  const isProfileComplete = checkProfileComplete();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    title: '',
    address: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    flatmates: '',
    rent: '',
    deposit: '',
    minStay: '',
    maxStay: '',
    availableBy: undefined,
    description: '',
    furnishing: '',
    petsAllowed: false,
    smokingAllowed: false,
    guestsAllowed: false,
    amenities: [],
    customAmenities: [],
    photos: [],
    bills: {
      wifi: { included: true, amount: '25' },
      water: { included: true, amount: '15' },
      electricity: { included: false, amount: '40' },
      gas: { included: true, amount: '30' },
      councilTax: { included: false, amount: '120' }
    },
    availability: []
  });
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setPropertyData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addCustomAmenity = () => {
    if (newCustomAmenity.trim()) {
      setPropertyData(prev => ({
        ...prev,
        customAmenities: [...prev.customAmenities, newCustomAmenity.trim()]
      }));
      setNewCustomAmenity('');
    }
  };

  const removeCustomAmenity = (amenity: string) => {
    setPropertyData(prev => ({
      ...prev,
      customAmenities: prev.customAmenities.filter(a => a !== amenity)
    }));
  };

  const addPhoto = () => {
    // Simulated photo upload
    const newPhoto = {
      url: `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80`,
      caption: newPhotoCaption
    };
    setPropertyData(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto]
    }));
    setNewPhotoCaption('');
  };

  const removePhoto = (index: number) => {
    setPropertyData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalBills = () => {
    const bills = propertyData.bills;
    let total = 0;
    if (bills.wifi.included) total += parseFloat(bills.wifi.amount) || 0;
    if (bills.water.included) total += parseFloat(bills.water.amount) || 0;
    if (bills.electricity.included) total += parseFloat(bills.electricity.amount) || 0;
    if (bills.gas.included) total += parseFloat(bills.gas.amount) || 0;
    if (bills.councilTax.included) total += parseFloat(bills.councilTax.amount) || 0;
    return total;
  };

  const toggleAvailability = (date: Date) => {
    const dateStr = date.toISOString();
    setPropertyData(prev => ({
      ...prev,
      availability: prev.availability.some(d => d.toISOString() === dateStr)
        ? prev.availability.filter(d => d.toISOString() !== dateStr)
        : [...prev.availability, date]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern 2-bed flat in City Centre"
                  value={propertyData.title}
                  onChange={(e) => setPropertyData({ ...propertyData, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Start typing address..."
                    value={propertyData.address}
                    onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={propertyData.propertyType} onValueChange={(value) => setPropertyData({ ...propertyData, propertyType: value })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="shared">Shared House</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="e.g., 2"
                  value={propertyData.bedrooms}
                  onChange={(e) => setPropertyData({ ...propertyData, bedrooms: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="e.g., 1"
                  value={propertyData.bathrooms}
                  onChange={(e) => setPropertyData({ ...propertyData, bathrooms: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="size">Size (sq. ft.)</Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="e.g., 850"
                  value={propertyData.size}
                  onChange={(e) => setPropertyData({ ...propertyData, size: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="flatmates">Number of Flatmates Allowed</Label>
                <Input
                  id="flatmates"
                  type="number"
                  placeholder="e.g., 2"
                  value={propertyData.flatmates}
                  onChange={(e) => setPropertyData({ ...propertyData, flatmates: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="rent">Rent Price (per month)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="rent"
                    type="number"
                    placeholder="e.g., 1200"
                    value={propertyData.rent}
                    onChange={(e) => setPropertyData({ ...propertyData, rent: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deposit">Security Deposit Amount</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="deposit"
                    type="number"
                    placeholder="e.g., 1200"
                    value={propertyData.deposit}
                    onChange={(e) => setPropertyData({ ...propertyData, deposit: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minStay">Minimum Stay (months)</Label>
                <Input
                  id="minStay"
                  type="number"
                  placeholder="e.g., 6"
                  value={propertyData.minStay}
                  onChange={(e) => setPropertyData({ ...propertyData, minStay: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="maxStay">Maximum Stay (months)</Label>
                <Input
                  id="maxStay"
                  type="number"
                  placeholder="e.g., 12"
                  value={propertyData.maxStay}
                  onChange={(e) => setPropertyData({ ...propertyData, maxStay: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="furnishing">Furnishing</Label>
                <Select value={propertyData.furnishing} onValueChange={(value) => setPropertyData({ ...propertyData, furnishing: value })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select furnishing status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully">Fully Furnished</SelectItem>
                    <SelectItem value="requires">Requires Furnishing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property..."
                  value={propertyData.description}
                  onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              <div className="md:col-span-2">
                <Label>House Rules</Label>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pets"
                      checked={propertyData.petsAllowed}
                      onCheckedChange={(checked) => setPropertyData({ ...propertyData, petsAllowed: checked as boolean })}
                    />
                    <label htmlFor="pets" className="text-sm cursor-pointer">
                      Pets Allowed
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smoking"
                      checked={propertyData.smokingAllowed}
                      onCheckedChange={(checked) => setPropertyData({ ...propertyData, smokingAllowed: checked as boolean })}
                    />
                    <label htmlFor="smoking" className="text-sm cursor-pointer">
                      Smoking Allowed
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="guests"
                      checked={propertyData.guestsAllowed}
                      onCheckedChange={(checked) => setPropertyData({ ...propertyData, guestsAllowed: checked as boolean })}
                    />
                    <label htmlFor="guests" className="text-sm cursor-pointer">
                      Guests Allowed
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Amenities</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AMENITIES.map((amenity) => (
                <div
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    propertyData.amenities.includes(amenity)
                      ? 'border-[#8C57FF] bg-[#8C57FF]/5'
                      : 'border-border hover:border-[#8C57FF]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{amenity}</span>
                    {propertyData.amenities.includes(amenity) && (
                      <Check className="h-4 w-4 text-[#8C57FF]" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label>Custom Amenities</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom amenity..."
                  value={newCustomAmenity}
                  onChange={(e) => setNewCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomAmenity()}
                />
                <Button onClick={addCustomAmenity} className="bg-[#8C57FF] hover:bg-[#7645E8]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {propertyData.customAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {propertyData.customAmenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#8C57FF]/10 text-[#8C57FF] rounded-full"
                    >
                      <span className="text-sm">{amenity}</span>
                      <button onClick={() => removeCustomAmenity(amenity)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Upload Photos</h2>
            
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-[#8C57FF]/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Drag & drop images here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports: JPG, PNG (Max 5MB each)</p>
            </div>

            {propertyData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {propertyData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-sm text-muted-foreground mt-2">{photo.caption}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <Label>Add Photo with Caption</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Photo caption..."
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                />
                <Button onClick={addPhoto} className="bg-[#8C57FF] hover:bg-[#7645E8]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Bills & Costs</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Bill Type</th>
                    <th className="text-center py-3 px-4">Included</th>
                    <th className="text-right py-3 px-4">Monthly Amount (£)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(propertyData.bills).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="py-3 px-4 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={value.included}
                          onCheckedChange={(checked) =>
                            setPropertyData({
                              ...propertyData,
                              bills: {
                                ...propertyData.bills,
                                [key]: { ...value, included: checked as boolean }
                              }
                            })
                          }
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={value.amount}
                          onChange={(e) =>
                            setPropertyData({
                              ...propertyData,
                              bills: {
                                ...propertyData.bills,
                                [key]: { ...value, amount: e.target.value }
                              }
                            })
                          }
                          className="text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-[#8C57FF]/5 rounded-lg border border-[#8C57FF]/20">
              <div className="flex justify-between items-center">
                <span className="text-[#4A4A68]">Total Estimated Monthly Cost</span>
                <span className="text-[#8C57FF]">£{calculateTotalBills().toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Availability Calendar</h2>
            <p className="text-sm text-muted-foreground">
              Select dates when the property is available for viewing
            </p>
            
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={propertyData.availability}
                onSelect={(dates) => setPropertyData({ ...propertyData, availability: dates || [] })}
                className="rounded-md border"
              />
            </div>

            {propertyData.availability.length > 0 && (
              <div className="p-4 bg-[#8C57FF]/5 rounded-lg">
                <p className="text-sm text-[#4A4A68] mb-2">
                  Selected dates: {propertyData.availability.length} day(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {propertyData.availability.slice(0, 5).map((date, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-[#8C57FF]/10 text-[#8C57FF] rounded">
                      {date.toLocaleDateString()}
                    </span>
                  ))}
                  {propertyData.availability.length > 5 && (
                    <span className="text-xs px-2 py-1 text-muted-foreground">
                      +{propertyData.availability.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-[#4A4A68]">Review & Publish</h2>
            
            <Card className="p-6 shadow-lg">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[#4A4A68] mb-1">{propertyData.title || 'Untitled Property'}</h3>
                    <p className="text-sm text-muted-foreground">{propertyData.address || 'No address provided'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-muted-foreground">Rent</p>
                    <p className="text-[#4A4A68]">£{propertyData.rent || '0'}/mo</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="text-[#4A4A68]">{propertyData.bedrooms || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="text-[#4A4A68]">{propertyData.bathrooms || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="text-[#4A4A68]">{propertyData.size || '0'} sq.ft</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm text-[#4A4A68]">Amenities</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {propertyData.amenities.length + propertyData.customAmenities.length} amenities selected
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm text-[#4A4A68]">Photos</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {propertyData.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo.url}
                        alt={photo.caption}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                    {propertyData.photos.length > 4 && (
                      <div className="w-20 h-20 bg-[#F4F5FA] rounded flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">+{propertyData.photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm text-[#4A4A68]">Bills & Costs</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-[#8C57FF]">
                    Total: £{calculateTotalBills().toFixed(2)}/mo
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-center mt-6">
              <Button className="px-8 bg-[#8C57FF] hover:bg-[#7645E8]" onClick={onPublish}>
                Publish Property
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#4A4A68] mb-2">Add New Property</h1>
        <p className="text-muted-foreground">List your property in a few simple steps</p>
      </div>

      {/* Profile Incomplete Alert */}
      {!isProfileComplete && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900">Complete Your Profile First</AlertTitle>
          <AlertDescription className="text-orange-800">
            You need to complete your profile information before adding a property. Please fill in your first name, last name, email, phone number, and nationality in the Settings page.
            <div className="mt-3">
              <Button
                onClick={() => onNavigate?.('settings')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Stepper and Form Content */}
      <div className={!isProfileComplete ? 'opacity-50 pointer-events-none' : ''}>
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.id
                        ? 'bg-[#8C57FF] text-white'
                        : currentStep > step.id
                        ? 'bg-[#8C57FF]/20 text-[#8C57FF]'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <p className={`text-xs ${currentStep === step.id ? 'text-[#8C57FF]' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.id ? 'bg-[#8C57FF]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="md:hidden text-center">
            <p className="text-sm text-[#8C57FF]">{STEPS[currentStep - 1].title}</p>
            <p className="text-xs text-muted-foreground">{STEPS[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 shadow-lg mb-6">
          {renderStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep < 6 && (
            <Button
              onClick={handleNext}
              className="bg-[#8C57FF] hover:bg-[#7645E8]"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
