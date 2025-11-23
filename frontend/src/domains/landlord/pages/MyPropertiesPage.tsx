import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Grid3x3, 
  List,
  Home,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { landlordService } from '../services/landlordService';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  status: 'active' | 'inactive' | 'rented';
  mainImage?: string;
  images: string[];
  type: string;
  description?: string;
  furnished?: boolean;
  amenities?: string[];
  createdAt: string;
}


interface MyPropertiesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
  onAddNew: () => void;
}

export function MyPropertiesPage({ onNavigate, onAddNew }: MyPropertiesPageProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await landlordService.getMyProperties();
      setProperties(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'inactive':
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

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await landlordService.deleteProperty(id);
      toast.success('Property deleted successfully');
      setDeleteConfirmId(null);
      // Refresh properties list
      await fetchProperties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete property');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#8C57FF]" />
      </div>
    );
  }

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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
                  src={property.mainImage || property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'}
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
                  {property.area && (
                    <>
                      <span>•</span>
                      <span>{property.area} sqft</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[#8C57FF]">£{property.price}</p>
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
                    src={property.mainImage || property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'}
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
                      {property.area && (
                        <>
                          <span>•</span>
                          <span>{property.area} sqft</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#8C57FF]">£{property.price}</p>
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
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
