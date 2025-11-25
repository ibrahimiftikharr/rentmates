import { useState, useEffect } from 'react';
import { Heart, MapPin, DollarSign, BedDouble, Bath, Maximize, Eye, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import { studentService, Property } from '../services/studentService';
import { PropertyDetailsPage } from '../components/property-details/PropertyDetailsPage';

interface WishlistPageProps {
  onNavigate?: (page: string, propertyId?: string) => void;
}

export function WishlistPage({ onNavigate }: WishlistPageProps) {
  const [wishlistItems, setWishlistItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const wishlist = await studentService.getWishlist();
      setWishlistItems(wishlist);
    } catch (error: any) {
      console.error('Failed to load wishlist:', error);
      toast.error(error.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (propertyId: string) => {
    const previousItems = [...wishlistItems];
    
    try {
      // Optimistically update UI first
      setWishlistItems(prev => prev.filter(item => item.id !== propertyId));
      
      // Call backend to remove
      await studentService.removeFromWishlist(propertyId);
      
      toast.success('Property removed from wishlist');
      
      // If viewing details of removed property, close it
      if (selectedProperty?.id === propertyId) {
        setSelectedProperty(null);
      }
    } catch (error: any) {
      // Rollback on error
      setWishlistItems(previousItems);
      console.error('Failed to remove from wishlist:', error);
      toast.error(error.message || 'Failed to remove property');
    }
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleBrowseProperties = () => {
    if (onNavigate) {
      onNavigate('search');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {selectedProperty ? (
        <PropertyDetailsPage
          property={selectedProperty}
          onClose={() => {
            setSelectedProperty(null);
            fetchWishlist(); // Refresh wishlist in case it was removed from details page
          }}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">My Wishlist</h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>
          </div>

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2">No Properties in Wishlist</h3>
          <p className="text-muted-foreground mb-6">
            Start adding properties to your wishlist to keep track of your favorites
          </p>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleBrowseProperties}>
            Browse Properties
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {wishlistItems.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="relative h-48">
                <img
                  src={property.mainImage || property.images?.[0] || 'https://via.placeholder.com/400x300'}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                  {property.availableFrom ? `Available ${new Date(property.availableFrom).toLocaleDateString()}` : 'Available Now'}
                </Badge>
              </div>
              
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm line-clamp-1">{property.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-primary">${property.price}/month</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pb-3 border-b">
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    <span>{property.bedrooms} Bed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{property.bathrooms} Bath</span>
                  </div>
                  {property.area && (
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span>{property.area} sqft</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="text-muted-foreground">Landlord:</span>
                  <span className="line-clamp-1">{property.landlord?.name || 'N/A'}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleViewProperty(property)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Property
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => handleRemove(property.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      )}
    </>
  );
}
