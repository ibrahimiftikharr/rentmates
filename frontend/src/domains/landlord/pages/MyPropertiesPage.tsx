import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Grid3x3, 
  List,
  Home
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

interface Property {
  id: string;
  title: string;
  address: string;
  rent: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  status: 'available' | 'pending' | 'rented';
  image: string;
  type: string;
}

// Mock data - will be replaced with real data
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern 2-Bed Flat in City Centre',
    address: '123 High Street, London, SW1A 1AA',
    rent: '1200',
    bedrooms: '2',
    bathrooms: '1',
    size: '850',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    type: 'apartment'
  },
  {
    id: '2',
    title: 'Cosy Studio Near University',
    address: '45 Park Lane, Manchester, M1 2AB',
    rent: '650',
    bedrooms: '1',
    bathrooms: '1',
    size: '450',
    status: 'rented',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    type: 'studio'
  },
  {
    id: '3',
    title: 'Spacious 3-Bed House with Garden',
    address: '78 Oak Avenue, Birmingham, B2 4QA',
    rent: '1800',
    bedrooms: '3',
    bathrooms: '2',
    size: '1200',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    type: 'shared'
  }
];

interface MyPropertiesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
  onAddNew: () => void;
}

export function MyPropertiesPage({ onNavigate, onAddNew }: MyPropertiesPageProps) {
  const [properties] = useState<Property[]>(MOCK_PROPERTIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'rented':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    // In real implementation, this would call an API
    console.log('Deleting property:', id);
    setDeleteConfirmId(null);
  };

  if (properties.length === 0) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[#4A4A68] mb-2">My Properties</h1>
            <p className="text-muted-foreground">Manage all your rental properties</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-[#F4F5FA] rounded-full flex items-center justify-center mb-6">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-[#4A4A68] mb-2">You haven't added any properties yet</h2>
          <p className="text-muted-foreground mb-6">Start by adding your first rental property</p>
          <Button onClick={onAddNew} className="bg-[#8C57FF] hover:bg-[#7645E8]">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Property
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[#4A4A68] mb-2">My Properties</h1>
          <p className="text-muted-foreground">Manage all your rental properties</p>
        </div>
        <Button onClick={onAddNew} className="bg-[#8C57FF] hover:bg-[#7645E8]">
          <Plus className="h-4 w-4 mr-2" />
          Add New Property
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 mb-6 shadow-md">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property title or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="rent-high">Rent: High to Low</SelectItem>
              <SelectItem value="rent-low">Rent: Low to High</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#8C57FF] hover:bg-[#7645E8]' : ''}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#8C57FF] hover:bg-[#7645E8]' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Properties Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className={`absolute top-3 right-3 ${getStatusColor(property.status)}`}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </Badge>
              </div>

              {/* Property Info */}
              <div className="p-5">
                <h3 className="text-[#4A4A68] mb-2 line-clamp-1">{property.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{property.address}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{property.bedrooms} bed</span>
                  <span>•</span>
                  <span>{property.bathrooms} bath</span>
                  <span>•</span>
                  <span>{property.size} sqft</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[#8C57FF]">£{property.rent}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onNavigate('property-details', property.id)}
                    className="flex-1 bg-[#8C57FF] hover:bg-[#7645E8]"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('property-details', property.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(property.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="flex">
                {/* Property Image */}
                <div className="relative w-64 h-48 flex-shrink-0">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className={`absolute top-3 right-3 ${getStatusColor(property.status)}`}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </Badge>
                </div>

                {/* Property Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[#4A4A68] mb-2">{property.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{property.address}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{property.bedrooms} bed</span>
                      <span>•</span>
                      <span>{property.bathrooms} bath</span>
                      <span>•</span>
                      <span>{property.size} sqft</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#8C57FF]">£{property.rent}</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onNavigate('property-details', property.id)}
                        className="bg-[#8C57FF] hover:bg-[#7645E8]"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('property-details', property.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(property.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredProperties.length > 9 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">Load More Properties</Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
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
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
