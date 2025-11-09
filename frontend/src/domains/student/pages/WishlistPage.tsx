import { useState } from 'react';
import { Heart, MapPin, DollarSign, BedDouble, Bath, Maximize, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

interface WishlistProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
  landlord: string;
  availability: string;
}

export function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistProperty[]>([
    {
      id: '1',
      title: 'Modern Student Apartment',
      address: '123 University Ave, Boston, MA',
      price: 1200,
      bedrooms: 2,
      bathrooms: 1,
      area: 750,
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      landlord: 'John Smith',
      availability: 'Available Now',
    },
    {
      id: '2',
      title: 'Cozy Studio Near Campus',
      address: '456 College St, Boston, MA',
      price: 950,
      bedrooms: 1,
      bathrooms: 1,
      area: 500,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      landlord: 'Sarah Johnson',
      availability: 'Available Dec 1',
    },
    {
      id: '3',
      title: 'Spacious 3BR House',
      address: '789 Student Lane, Boston, MA',
      price: 2100,
      bedrooms: 3,
      bathrooms: 2,
      area: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      landlord: 'Michael Brown',
      availability: 'Available Jan 1',
    },
  ]);

  const handleRemove = (id: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
    toast.success('Property removed from wishlist');
  };

  const handleViewProperty = (property: WishlistProperty) => {
    toast.info(`Opening details for ${property.title}`);
    // This would navigate to property details page
  };

  return (
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
          <Button className="bg-primary hover:bg-primary/90">
            Browse Properties
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {wishlistItems.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="relative h-48">
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                  {property.availability}
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
                  <div className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    <span>{property.area} sqft</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="text-muted-foreground">Landlord:</span>
                  <span className="line-clamp-1">{property.landlord}</span>
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
  );
}
