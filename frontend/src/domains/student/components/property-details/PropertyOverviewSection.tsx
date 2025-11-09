import { useState } from 'react';
import { MapPin, BedDouble, Users, Home, DollarSign, Calendar, Wifi, Droplet, Zap, Flame, Wind, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

interface PropertyOverviewProps {
  property: any;
}

export function PropertyOverviewSection({ property }: PropertyOverviewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const billsIncluded = [
    { name: 'Wifi', included: true, estimate: '£25/mo', icon: Wifi },
    { name: 'Water', included: true, estimate: '£15/mo', icon: Droplet },
    { name: 'Electricity', included: false, estimate: '£40/mo', icon: Zap },
    { name: 'Gas/Heating', included: true, estimate: '£30/mo', icon: Flame },
    { name: 'Council Tax', included: false, estimate: '£120/mo', icon: Home },
  ];

  const amenities = [
    'Fully Furnished', 'High-Speed WiFi', 'Washing Machine', 
    'Dishwasher', 'Central Heating', 'Gym Access', 'Study Room', 'Bike Storage'
  ];

  const rules = [
    { label: 'Pets Allowed', allowed: false },
    { label: 'Smoking Allowed', allowed: false },
    { label: 'Guests Allowed', allowed: true },
  ];

  // Get up to 4 additional images
  const thumbnails = property.images.slice(1, 5);

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-3">{property.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg">{property.address}</span>
            </div>
          </div>
          <Badge className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 text-lg">
            Available Now
          </Badge>
        </div>

        {/* Photo Gallery - Modern Grid Layout */}
        <div className="grid grid-cols-4 gap-3 h-[500px]">
          {/* Main Large Image */}
          <div 
            className="col-span-3 row-span-2 rounded-2xl overflow-hidden cursor-pointer group relative shadow-xl hover:shadow-2xl transition-shadow"
            onClick={() => {
              setSelectedImage(0);
              setShowImageModal(true);
            }}
          >
            <img 
              src={property.images[0]} 
              alt="Main property view"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Smaller Thumbnails on Right */}
          {thumbnails.map((image: string, index: number) => (
            <div 
              key={index}
              className="rounded-xl overflow-hidden cursor-pointer group relative shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => {
                setSelectedImage(index + 1);
                setShowImageModal(true);
              }}
            >
              <img 
                src={image} 
                alt={`Property view ${index + 2}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {index === 3 && property.images.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-semibold text-xl">
                    +{property.images.length - 5} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="shadow-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-2xl transition-shadow">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Monthly Rent</p>
              <p className="text-4xl text-primary mb-1">£{property.price}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Security Deposit</p>
              <p className="text-4xl mb-1">£{property.price * 1.5}</p>
              <p className="text-xs text-muted-foreground">refundable</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Property Type</p>
              <p className="text-3xl capitalize mb-1">{property.type}</p>
              <p className="text-xs text-muted-foreground">
                {property.shared ? 'Shared Living' : 'Fully Private'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Property Details Cards */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BedDouble className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Space Type</p>
                  <p className="text-muted-foreground">
                    {property.shared ? 'Shared Space with Private Bedroom' : 'Fully Private Space'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Stay Duration</p>
                  <p className="text-muted-foreground">
                    Min: 3 months • Max: 12 months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b">
            <CardTitle>About This Property</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-muted-foreground leading-relaxed text-lg">
              {property.description || "Beautiful student accommodation in a prime location. Perfect for students looking for a comfortable and convenient living space. Close to universities, public transport, and local amenities. The property features modern furnishings and all essential facilities for a comfortable student life."}
            </p>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b">
            <CardTitle>Amenities & Features</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bills & Utilities - Improved Design */}
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Bills & Utilities Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {billsIncluded.map((bill, index) => (
                <Card 
                  key={index} 
                  className={`shadow-md hover:shadow-xl transition-all border-2 ${
                    bill.included 
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100/50' 
                      : 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                          bill.included ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          <bill.icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{bill.name}</p>
                          <p className="text-sm text-muted-foreground">Est. {bill.estimate}</p>
                        </div>
                      </div>
                      <Badge className={`px-4 py-2 ${bill.included ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>
                        {bill.included ? '✓ Included' : '✗ Not Included'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Estimate */}
            <Card className="mt-6 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-blue-500/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">Total Monthly Cost (with bills)</p>
                    <p className="text-3xl text-primary">
                      £{property.price + 70}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Included Bills Value</p>
                    <p className="text-2xl text-green-600">£70</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* House Rules */}
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b">
            <CardTitle>House Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-6">
              {rules.map((rule, index) => (
                <Card 
                  key={index} 
                  className={`shadow-md hover:shadow-lg transition-all text-center border-2 ${
                    rule.allowed 
                      ? 'border-green-300 bg-green-50/50' 
                      : 'border-red-300 bg-red-50/50'
                  }`}
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      rule.allowed ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {rule.allowed ? (
                        <span className="text-white text-3xl">✓</span>
                      ) : (
                        <X className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <p className={`font-semibold text-lg mb-2 ${rule.allowed ? 'text-green-900' : 'text-red-900'}`}>
                      {rule.label}
                    </p>
                    <p className={`text-sm ${rule.allowed ? 'text-green-600' : 'text-red-600'}`}>
                      {rule.allowed ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={property.images[selectedImage]} 
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
