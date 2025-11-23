import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Save,
  X,
  Plus,
  Check,
  Upload,
  Home as HomeIcon,
  Bed,
  Bath,
  Maximize,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  PoundSterling,
  Ruler,
  Clock,
  Sofa,
  FileText,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Calendar } from '@/shared/ui/calendar';
import { landlordService } from '../services/landlordService';
import { toast } from 'sonner';

interface PropertyDetailsPageProps {
  onNavigate: (page: string) => void;
}

const AMENITIES = [
  'WiFi', 'Heating', 'Air Conditioning', 'Dishwasher', 'Washing Machine',
  'Dryer', 'Study Desk', 'Gym Access', 'Parking', 'Garden', 'Balcony',
  'Storage Space', 'TV', 'Microwave', 'Oven', 'Fridge/Freezer'
];

// Mock property data
const MOCK_PROPERTY = {
  id: '1',
  title: 'Modern 2-Bed Flat in City Centre',
  address: '123 High Street, London, SW1A 1AA',
  rent: '1200',
  deposit: '1200',
  bedrooms: '2',
  bathrooms: '1',
  size: '850',
  flatmates: '2',
  minStay: '6',
  maxStay: '12',
  status: 'available',
  propertyType: 'apartment',
  furnishing: 'fully',
  description: 'Beautiful modern apartment in the heart of the city. Close to all amenities and public transport. Perfect for students or young professionals.',
  petsAllowed: false,
  smokingAllowed: false,
  guestsAllowed: true,
  amenities: ['WiFi', 'Heating', 'Washing Machine', 'Study Desk', 'Parking'],
  photos: [
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', caption: 'Living Room' },
    { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', caption: 'Bedroom' },
    { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', caption: 'Kitchen' }
  ],
  bills: {
    wifi: { included: true, amount: '25' },
    water: { included: true, amount: '15' },
    electricity: { included: false, amount: '40' },
    gas: { included: true, amount: '30' },
    councilTax: { included: false, amount: '120' }
  },
  availability: []
};

export function PropertyDetailsPage({ onNavigate }: PropertyDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    console.log('PropertyDetailsPage mounted, id:', id);
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching property with ID:', id);
      const data = await landlordService.getProperty(id!);
      console.log('Property data received:', data);
      
      // Transform backend data to match component expectations
      const billsIncludedSet = new Set(data.billsIncluded || []);
      
      const transformedProperty = {
        ...data,
        rent: data.price?.toString() || '0',
        size: data.area?.toString() || '',
        flatmates: '0', // Not stored in backend yet
        deposit: data.deposit?.toString() || '0',
        minStay: data.minimumStay?.toString() || '',
        maxStay: data.maximumStay?.toString() || '',
        status: data.status || 'active',
        propertyType: data.type || 'apartment',
        furnishing: data.furnished ? 'fully' : 'unfurnished',
        photos: data.images?.length > 0 ? data.images.map((url: string, index: number) => ({
          url,
          caption: index === 0 ? 'Main Image' : `Image ${index + 1}`
        })) : [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', caption: 'Default' }],
        bills: {
          wifi: { 
            included: billsIncludedSet.has('WiFi') || billsIncludedSet.has('wifi'),
            amount: data.billPrices?.wifi?.toString() || '0'
          },
          water: { 
            included: billsIncludedSet.has('Water') || billsIncludedSet.has('water'),
            amount: data.billPrices?.water?.toString() || '0'
          },
          electricity: { 
            included: billsIncludedSet.has('Electricity') || billsIncludedSet.has('electricity'),
            amount: data.billPrices?.electricity?.toString() || '0'
          },
          gas: { 
            included: billsIncludedSet.has('Gas') || billsIncludedSet.has('gas'),
            amount: data.billPrices?.gas?.toString() || '0'
          },
          councilTax: { 
            included: billsIncludedSet.has('Council Tax') || billsIncludedSet.has('councilTax'),
            amount: data.billPrices?.councilTax?.toString() || '0'
          }
        },
        petsAllowed: data.houseRules?.petsAllowed || false,
        smokingAllowed: data.houseRules?.smokingAllowed || false,
        guestsAllowed: data.houseRules?.guestsAllowed !== false,
        availability: (data.availabilityDates || []).map((dateStr: string | Date) => 
          typeof dateStr === 'string' ? new Date(dateStr) : dateStr
        ),
        amenities: data.amenities || []
      };
      
      console.log('Transformed property:', transformedProperty);
      setProperty(transformedProperty);
    } catch (error: any) {
      console.error('Failed to load property:', error);
      toast.error(error.message || 'Failed to load property details');
      // Don't navigate away immediately, set property to null to show error state
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending':
      case 'inactive':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'rented':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const calculateTotalBills = () => {
    if (!property?.bills) return 0;
    const bills = property.bills;
    let total = 0;
    if (bills.wifi.included) total += parseFloat(bills.wifi.amount) || 0;
    if (bills.water.included) total += parseFloat(bills.water.amount) || 0;
    if (bills.electricity.included) total += parseFloat(bills.electricity.amount) || 0;
    if (bills.gas.included) total += parseFloat(bills.gas.amount) || 0;
    if (bills.councilTax.included) total += parseFloat(bills.councilTax.amount) || 0;
    return total;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Transform property data back to backend format
      const updateData = {
        title: property.title,
        description: property.description,
        type: property.propertyType,
        address: property.address,
        bedrooms: parseInt(property.bedrooms) || 0,
        bathrooms: parseInt(property.bathrooms) || 0,
        area: property.size ? parseInt(property.size) : undefined,
        furnished: property.furnishing === 'fully',
        price: parseFloat(property.rent) || 0,
        deposit: property.deposit ? parseFloat(property.deposit) : undefined,
        minimumStay: property.minStay ? parseInt(property.minStay) : undefined,
        maximumStay: property.maxStay ? parseInt(property.maxStay) : undefined,
        amenities: property.amenities,
        billsIncluded: Object.entries(property.bills)
          .filter(([_, bill]: [string, any]) => bill.included)
          .map(([key, _]: [string, any]) => {
            const billNames: Record<string, string> = {
              wifi: 'WiFi',
              water: 'Water',
              electricity: 'Electricity',
              gas: 'Gas',
              councilTax: 'Council Tax'
            };
            return billNames[key] || key;
          }),
        billPrices: {
          wifi: parseFloat(property.bills.wifi.amount) || 0,
          water: parseFloat(property.bills.water.amount) || 0,
          electricity: parseFloat(property.bills.electricity.amount) || 0,
          gas: parseFloat(property.bills.gas.amount) || 0,
          councilTax: parseFloat(property.bills.councilTax.amount) || 0
        },
        houseRules: {
          petsAllowed: property.petsAllowed,
          smokingAllowed: property.smokingAllowed,
          guestsAllowed: property.guestsAllowed
        },
        availabilityDates: property.availability.map((date: Date) => date.toISOString())
      };

      await landlordService.updateProperty(id!, updateData);
      toast.success('Property updated successfully');
      setEditMode(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      // Refresh property data
      await fetchPropertyDetails();
    } catch (error: any) {
      console.error('Failed to update property:', error);
      toast.error(error.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await landlordService.deleteProperty(id!);
      toast.success('Property deleted successfully');
      onNavigate('my-properties');
    } catch (error: any) {
      console.error('Failed to delete property:', error);
      toast.error(error.message || 'Failed to delete property');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#8C57FF]" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <h2 className="text-[#4A4A68] mb-2">Property not found</h2>
          <Button onClick={() => onNavigate('my-properties')} className="bg-[#8C57FF] hover:bg-[#7645E8] mt-4">
            Back to My Properties
          </Button>
        </div>
      </div>
    );
  }

  const toggleAmenity = (amenity: string) => {
    setProperty(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        amenities: prev.amenities?.includes(amenity)
          ? prev.amenities.filter(a => a !== amenity)
          : [...(prev.amenities || []), amenity]
      };
    });
  };

  const removePhoto = (index: number) => {
    setProperty(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        photos: prev.photos?.filter((_, i) => i !== index) || []
      };
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => onNavigate('my-properties')}
        className="flex items-center text-muted-foreground hover:text-[#8C57FF] mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to My Properties
      </button>

      {/* Header Section */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="h-80 relative">
          <img
            src={property.photos[0]?.url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <Badge className={`mb-3 ${getStatusColor(property.status)}`}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </Badge>
                <h1 className="mb-2 text-white">{property.title}</h1>
                <p className="text-white/90 mb-4">{property.address}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white">£{property.rent}</span>
                  <span className="text-white/70 text-sm">per month</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditMode('overview')}
                  className="bg-[#8C57FF] hover:bg-[#7645E8]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Property
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-white/10 hover:bg-red-600 border-white/20 text-white hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="bills">Bills & Costs</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Edit Controls */}
            <Card className="p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-[#4A4A68]">Property Overview</h2>
                {editMode !== 'overview' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode('overview')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#8C57FF] hover:bg-[#7645E8]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Key Property Details - Icon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Property Type */}
              <Card className="p-5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8C57FF]/10 rounded-lg">
                    <HomeIcon className="h-5 w-5 text-[#8C57FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#8C57FF] mb-1">Property Type</p>
                    {editMode === 'overview' ? (
                      <Select
                        value={property.propertyType}
                        onValueChange={(value) => setProperty({ ...property, propertyType: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="shared">Shared House</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[#4A4A68] capitalize">{property.propertyType}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Bedrooms */}
              <Card className="p-5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8C57FF]/10 rounded-lg">
                    <Bed className="h-5 w-5 text-[#8C57FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#8C57FF] mb-1">Bedrooms</p>
                    {editMode === 'overview' ? (
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={property.bedrooms}
                        onChange={(e) => setProperty({ ...property, bedrooms: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <p className="text-[#4A4A68]">{property.bedrooms}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Bathrooms */}
              <Card className="p-5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8C57FF]/10 rounded-lg">
                    <Bath className="h-5 w-5 text-[#8C57FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#8C57FF] mb-1">Bathrooms</p>
                    {editMode === 'overview' ? (
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={property.bathrooms}
                        onChange={(e) => setProperty({ ...property, bathrooms: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <p className="text-[#4A4A68]">{property.bathrooms}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Size */}
              <Card className="p-5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8C57FF]/10 rounded-lg">
                    <Maximize className="h-5 w-5 text-[#8C57FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#8C57FF] mb-1">Size</p>
                    {editMode === 'overview' ? (
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={property.size}
                        onChange={(e) => setProperty({ ...property, size: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <p className="text-[#4A4A68]">{property.size} sq.ft</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Pricing & Tenancy Details */}
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <PoundSterling className="h-5 w-5 text-[#8C57FF]" />
                <h3 className="text-[#8C57FF]">Pricing & Tenancy</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Rent Price */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Monthly Rent</p>
                  {editMode === 'overview' ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={property.rent}
                        onChange={(e) => setProperty({ ...property, rent: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  ) : (
                    <p className="text-[#4A4A68]">£{property.rent}</p>
                  )}
                </div>

                {/* Security Deposit */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Security Deposit</p>
                  {editMode === 'overview' ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={property.deposit}
                        onChange={(e) => setProperty({ ...property, deposit: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  ) : (
                    <p className="text-[#4A4A68]">£{property.deposit}</p>
                  )}
                </div>

                {/* Flatmates */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Flatmates Allowed</p>
                  {editMode === 'overview' ? (
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={property.flatmates}
                      onChange={(e) => setProperty({ ...property, flatmates: e.target.value })}
                    />
                  ) : (
                    <p className="text-[#4A4A68]">{property.flatmates}</p>
                  )}
                </div>

                {/* Min Stay */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Minimum Stay</p>
                  {editMode === 'overview' ? (
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={property.minStay}
                      onChange={(e) => setProperty({ ...property, minStay: e.target.value })}
                    />
                  ) : (
                    <p className="text-[#4A4A68]">{property.minStay} months</p>
                  )}
                </div>

                {/* Max Stay */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Maximum Stay</p>
                  {editMode === 'overview' ? (
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={property.maxStay}
                      onChange={(e) => setProperty({ ...property, maxStay: e.target.value })}
                    />
                  ) : (
                    <p className="text-[#4A4A68]">{property.maxStay} months</p>
                  )}
                </div>

                {/* Furnishing */}
                <div>
                  <p className="text-sm text-[#8C57FF] mb-2">Furnishing</p>
                  {editMode === 'overview' ? (
                    <Select
                      value={property.furnishing}
                      onValueChange={(value) => setProperty({ ...property, furnishing: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully">Fully Furnished</SelectItem>
                        <SelectItem value="requires">Requires Furnishing</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-[#4A4A68]">
                      {property.furnishing === 'fully' ? 'Fully Furnished' : 'Requires Furnishing'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[#8C57FF]" />
                <h3 className="text-[#8C57FF]">Property Description</h3>
              </div>
              {editMode === 'overview' ? (
                <Textarea
                  value={property.description}
                  onChange={(e) => setProperty({ ...property, description: e.target.value })}
                  className="min-h-[120px]"
                />
              ) : (
                <p className="text-[#4A4A68] leading-relaxed">{property.description}</p>
              )}
            </Card>

            {/* House Rules */}
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[#8C57FF]" />
                <h3 className="text-[#8C57FF]">House Rules</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {editMode === 'overview' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pets-edit"
                        checked={property.petsAllowed}
                        onCheckedChange={(checked) => setProperty({ ...property, petsAllowed: checked as boolean })}
                      />
                      <label htmlFor="pets-edit" className="text-sm cursor-pointer">
                        Pets Allowed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smoking-edit"
                        checked={property.smokingAllowed}
                        onCheckedChange={(checked) => setProperty({ ...property, smokingAllowed: checked as boolean })}
                      />
                      <label htmlFor="smoking-edit" className="text-sm cursor-pointer">
                        Smoking Allowed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="guests-edit"
                        checked={property.guestsAllowed}
                        onCheckedChange={(checked) => setProperty({ ...property, guestsAllowed: checked as boolean })}
                      />
                      <label htmlFor="guests-edit" className="text-sm cursor-pointer">
                        Guests Allowed
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {property.petsAllowed && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Pets Allowed
                      </Badge>
                    )}
                    {property.smokingAllowed && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Smoking Allowed
                      </Badge>
                    )}
                    {property.guestsAllowed && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Guests Allowed
                      </Badge>
                    )}
                    {!property.petsAllowed && !property.smokingAllowed && !property.guestsAllowed && (
                      <p className="text-muted-foreground text-sm">No special rules</p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities">
          <Card className="p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#4A4A68]">Amenities</h2>
              {editMode !== 'amenities' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode('amenities')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#8C57FF] hover:bg-[#7645E8]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {editMode === 'amenities' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AMENITIES.map((amenity) => (
                  <div
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      property.amenities.includes(amenity)
                        ? 'border-[#8C57FF] bg-[#8C57FF]/5'
                        : 'border-border hover:border-[#8C57FF]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{amenity}</span>
                      {property.amenities.includes(amenity) && (
                        <Check className="h-4 w-4 text-[#8C57FF]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 p-3 bg-[#8C57FF]/5 rounded-lg"
                  >
                    <Check className="h-4 w-4 text-[#8C57FF]" />
                    <span className="text-sm text-[#4A4A68]">{amenity}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card className="p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#4A4A68]">Property Photos</h2>
              <Button className="bg-[#8C57FF] hover:bg-[#7645E8]">
                <Plus className="h-4 w-4 mr-2" />
                Add New Photos
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {property.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removePhoto(index)}
                      className="bg-white/20 border-white/40 text-white hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{photo.caption}</p>
                </div>
              ))}

              <div className="border-2 border-dashed border-border rounded-lg h-48 flex items-center justify-center hover:border-[#8C57FF]/50 transition-colors cursor-pointer">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Add More Photos</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Bills & Costs Tab */}
        <TabsContent value="bills">
          <Card className="p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#4A4A68]">Bills & Costs</h2>
              {editMode !== 'bills' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode('bills')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#8C57FF] hover:bg-[#7645E8]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

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
                  {Object.entries(property.bills).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="py-3 px-4 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editMode === 'bills' ? (
                          <Checkbox
                            checked={value.included}
                            onCheckedChange={(checked) =>
                              setProperty({
                                ...property,
                                bills: {
                                  ...property.bills,
                                  [key]: { ...value, included: checked as boolean }
                                }
                              })
                            }
                          />
                        ) : (
                          value.included ? <Check className="h-4 w-4 mx-auto text-green-600" /> : <X className="h-4 w-4 mx-auto text-red-600" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editMode === 'bills' ? (
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            value={value.amount}
                            onChange={(e) =>
                              setProperty({
                                ...property,
                                bills: {
                                  ...property.bills,
                                  [key]: { ...value, amount: e.target.value }
                                }
                              })
                            }
                            className="text-right"
                          />
                        ) : (
                          <p className="text-right">£{value.amount}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-[#8C57FF]/5 rounded-lg border border-[#8C57FF]/20 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-[#4A4A68]">Total Estimated Monthly Cost</span>
                <span className="text-[#8C57FF]">£{calculateTotalBills().toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card className="p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#4A4A68]">Availability Calendar</h2>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#8C57FF] hover:bg-[#7645E8]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Availability
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Select dates when the property is available for student visits
            </p>

            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={property.availability}
                onSelect={(dates) => setProperty({ ...property, availability: dates || [] })}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </div>

            {property.availability.length > 0 && (
              <div className="p-4 bg-[#8C57FF]/5 rounded-lg mt-6">
                <p className="text-sm text-[#4A4A68] mb-2">
                  Selected dates: {property.availability.length} day(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {property.availability.slice(0, 5).map((date, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-[#8C57FF]/10 text-[#8C57FF] rounded">
                      {date.toLocaleDateString()}
                    </span>
                  ))}
                  {property.availability.length > 5 && (
                    <span className="text-xs px-2 py-1 text-muted-foreground">
                      +{property.availability.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-[#4A4A68] mb-3">Delete Property</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Property'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="h-5 w-5" />
          Changes saved successfully
        </div>
      )}
    </div>
  );
}
