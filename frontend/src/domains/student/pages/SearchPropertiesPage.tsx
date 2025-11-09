import { useState } from 'react';
import { Search, SlidersHorizontal, Heart, MapPin, BedDouble, Bath, Maximize } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { PropertyDetailsPage } from '../components/property-details/PropertyDetailsPage';
import { toast } from 'sonner';

interface Property {
  id: number;
  title: string;
  price: number;
  type: 'flat' | 'house' | 'studio';
  image: string;
  images: string[];
  distance: number;
  university: string;
  city: string;
  address: string;
  bills: string[];
  isWishlisted: boolean;
  shared: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  description?: string;
}

interface SearchPropertiesPageProps {
  onNavigate?: (page: string) => void;
}

export function SearchPropertiesPage({ onNavigate }: SearchPropertiesPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([300, 2000]);
  const [propertyType, setPropertyType] = useState<string[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [moveInMonth, setMoveInMonth] = useState('');
  const [moveInYear, setMoveInYear] = useState('');
  const [stayLength, setStayLength] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Mock properties data
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      title: 'Modern Studio near Campus',
      price: 850,
      type: 'studio',
      image: 'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGlvJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjMyMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 0.5,
      university: 'Oxford University',
      city: 'Oxford',
      address: '42 Park End Street, Oxford, OX1 1HP',
      bills: ['Gas', 'Electricity'],
      isWishlisted: false,
      shared: false,
      bedrooms: 1,
      bathrooms: 1,
      area: 450,
    },
    {
      id: 2,
      title: 'Spacious 2-Bed Flat with Garden',
      price: 1200,
      type: 'flat',
      image: 'https://images.unsplash.com/photo-1757780993465-7f1923296763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmbGF0JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyNDI2ODg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1757780993465-7f1923296763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 1.2,
      university: 'Cambridge University',
      city: 'Cambridge',
      address: '28 Mill Road, Cambridge, CB1 2AD',
      bills: [],
      isWishlisted: false,
      shared: true,
      bedrooms: 2,
      bathrooms: 1,
      area: 750,
    },
    {
      id: 3,
      title: 'Cozy Student House - 4 Bedrooms',
      price: 1800,
      type: 'house',
      image: 'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaG91c2UlMjByZW50YWx8ZW58MXx8fHwxNzYyNDM0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 0.8,
      university: 'Oxford University',
      city: 'Oxford',
      address: '156 Cowley Road, Oxford, OX4 1UE',
      bills: ['Gas', 'Electricity'],
      isWishlisted: true,
      shared: true,
      bedrooms: 4,
      bathrooms: 2,
      area: 1200,
    },
    {
      id: 4,
      title: 'Luxury Apartment in City Centre',
      price: 1500,
      type: 'flat',
      image: 'https://images.unsplash.com/photo-1758471576052-a7e3d287a7ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwYXBhcnRtZW50JTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzYyNDM0ODQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1758471576052-a7e3d287a7ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1574643156929-51fa098b0394?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 2.1,
      university: 'Cambridge University',
      city: 'Cambridge',
      address: '8 Market Street, Cambridge, CB2 3QE',
      bills: ['Gas'],
      isWishlisted: false,
      shared: false,
      bedrooms: 3,
      bathrooms: 2,
      area: 950,
    },
    {
      id: 5,
      title: 'Affordable Studio Close to Library',
      price: 650,
      type: 'studio',
      image: 'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGlvJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjMyMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 0.3,
      university: 'Oxford University',
      city: 'Oxford',
      address: '90 High Street, Oxford, OX1 4BG',
      bills: ['Gas', 'Electricity'],
      isWishlisted: false,
      shared: false,
      bedrooms: 1,
      bathrooms: 1,
      area: 400,
    },
    {
      id: 6,
      title: 'Victorian House Share',
      price: 950,
      type: 'house',
      image: 'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaG91c2UlMjByZW50YWx8ZW58MXx8fHwxNzYyNDM0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      images: [
        'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      ],
      distance: 1.5,
      university: 'Cambridge University',
      city: 'Cambridge',
      address: '34 Victoria Avenue, Cambridge, CB4 3DU',
      bills: [],
      isWishlisted: false,
      shared: true,
      bedrooms: 3,
      bathrooms: 2,
      area: 1000,
    },
  ]);

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleBillsToggle = (bill: string) => {
    setSelectedBills(prev =>
      prev.includes(bill) ? prev.filter(b => b !== bill) : [...prev, bill]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setPriceRange([300, 2000]);
    setPropertyType([]);
    setSelectedBills([]);
    setMoveInMonth('');
    setMoveInYear('');
    setStayLength('');
    setSortBy('price');
    toast.success('All filters cleared');
  };

  const toggleWishlist = (propertyId: number) => {
    setProperties(prev =>
      prev.map(prop =>
        prop.id === propertyId
          ? { ...prop, isWishlisted: !prop.isWishlisted }
          : prop
      )
    );
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      toast.success(
        property.isWishlisted
          ? 'Removed from wishlist'
          : 'Added to wishlist'
      );
    }
  };

  // Filter and sort properties
  const filteredProperties = properties
    .filter(prop => {
      const matchesSearch =
        searchQuery === '' ||
        prop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice =
        prop.price >= priceRange[0] && prop.price <= priceRange[1];

      const matchesType =
        propertyType.length === 0 || propertyType.includes(prop.type);

      const matchesBills =
        selectedBills.length === 0 ||
        (selectedBills.includes('No bills') && prop.bills.length === 0) ||
        selectedBills.some(bill => bill !== 'No bills' && prop.bills.includes(bill));

      return matchesSearch && matchesPrice && matchesType && matchesBills;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      } else if (sortBy === 'proximity') {
        return a.distance - b.distance;
      }
      return 0;
    });

  return (
    <>
      {selectedProperty ? (
        <PropertyDetailsPage
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="mb-2">Find Your Perfect Property</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Search and filter properties near your university
            </p>
          </div>

          {/* Search Bar */}
          <Card className="shadow-sm border-2">
  <CardContent className="p-4 md:p-6">
    <div className="flex flex-col sm:flex-row gap-3">
      
      {/* Search Bar */}
      <div className="flex flex-1 items-center bg-gray-50 border-2 rounded-md h-12 md:h-14 px-4 focus-within:border-primary">
        <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
        <Input
          placeholder="Search by city, university, or property name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base flex-1 placeholder:text-muted-foreground"
        />
      </div>

      {/* Filters Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-6 border-2 h-12 md:h-14"
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span className="hidden sm:inline">
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </span>
        <span className="sm:hidden">Filters</span>
      </Button>
    </div>
  </CardContent>
</Card>



          {/* Filters - Horizontal Layout at Top */}
          {showFilters && (
            <Card className="shadow-xl border-2">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span>Filters</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-primary hover:text-primary hover:bg-primary/10 text-xs md:text-sm"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Price Range */}
                  <div className="lg:col-span-2">
                    <Label className="mb-4 block font-semibold">Price Range</Label>
                    <div className="space-y-4">
                      <Slider
                        min={300}
                        max={2000}
                        step={50}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="my-6"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-1 p-3 rounded-lg bg-primary/10 border-2 border-primary/20 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Min</p>
                          <p className="font-semibold text-primary">£{priceRange[0]}</p>
                        </div>
                        <div className="w-8 h-0.5 bg-border" />
                        <div className="flex-1 p-3 rounded-lg bg-primary/10 border-2 border-primary/20 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Max</p>
                          <p className="font-semibold text-primary">£{priceRange[1]}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <Label className="mb-4 block font-semibold">Property Type</Label>
                    <div className="space-y-3">
                      {['flat', 'house', 'studio'].map(type => (
                        <div key={type} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={type}
                            checked={propertyType.includes(type)}
                            onCheckedChange={() => handlePropertyTypeToggle(type)}
                            className="border-2"
                          />
                          <Label
                            htmlFor={type}
                            className="cursor-pointer capitalize flex-1"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bills Filter */}
                  <div>
                    <Label className="mb-4 block font-semibold">Bills Included</Label>
                    <div className="space-y-3">
                      {['Gas', 'Electricity', 'No bills'].map(bill => (
                        <div key={bill} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={bill}
                            checked={selectedBills.includes(bill)}
                            onCheckedChange={() => handleBillsToggle(bill)}
                            className="border-2"
                          />
                          <Label htmlFor={bill} className="cursor-pointer flex-1">
                            {bill}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Move-in & Stay Length */}
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block font-semibold">Move-in Date</Label>
                      <div className="space-y-2">
                        <Select value={moveInMonth} onValueChange={setMoveInMonth}>
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={moveInYear} onValueChange={setMoveInYear}>
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {['2024', '2025', '2026'].map(year => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block font-semibold">Stay Length</Label>
                      <Select value={stayLength} onValueChange={setStayLength}>
                        <SelectTrigger className="border-2">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {['3', '6', '9', '12', '12+'].map(length => (
                            <SelectItem key={length} value={length}>
                              {length} months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-card">
            <p className="font-medium">
              <span className="text-primary">{filteredProperties.length}</span> {filteredProperties.length === 1 ? 'property' : 'properties'} found
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <Label className="text-muted-foreground">Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="proximity">Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <Card key={property.id} className="shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 group">
                <div className="relative overflow-hidden">
                  <ImageWithFallback
                    src={property.image}
                    alt={property.title}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button
                    onClick={() => toggleWishlist(property.id)}
                    className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm border-2 transition-all shadow-lg ${ 
                      property.isWishlisted
                        ? 'bg-red-500 border-red-400 text-white scale-110'
                        : 'bg-white/90 border-white text-gray-600 hover:bg-red-500 hover:border-red-400 hover:text-white hover:scale-110'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${property.isWishlisted ? 'fill-current' : ''}`}
                    />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-primary/90 backdrop-blur-sm text-white border-0 capitalize px-3 py-1">
                      {property.type}
                    </Badge>
                    {property.shared && (
                      <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 px-3 py-1">
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="mb-2 line-clamp-1 group-hover:text-primary transition-colors">{property.title}</h3>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{property.distance} km from {property.university}</span>
                    </div>
                  </div>

                  {/* Property Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4" />
                        <span>{property.bedrooms} Bed</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        <span>{property.bathrooms} Bath</span>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-1.5">
                        <Maximize className="w-4 h-4" />
                        <span>{property.area} sqft</span>
                      </div>
                    )}
                  </div>

                  {/* Bills Tags */}
                  {property.bills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {property.bills.map(bill => (
                        <Badge key={bill} variant="outline" className="text-xs border-2">
                          ✓ {bill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-3xl text-primary">£{property.price}</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                      onClick={() => setSelectedProperty(property)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredProperties.length === 0 && (
            <Card className="shadow-md border-2">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="mb-3">No properties found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search criteria to find the perfect property
                </p>
                <Button onClick={handleClearFilters} variant="outline" size="lg" className="border-2">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
