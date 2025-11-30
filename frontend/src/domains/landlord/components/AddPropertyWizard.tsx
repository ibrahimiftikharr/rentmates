import { useState } from 'react';
import { Plus, Home, Upload, CheckSquare, Eye } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { CURRENCIES, getCurrencySymbol } from '@/shared/utils/currency';

const amenities = [
  'Parking', 'WiFi', 'Furnished', 'Air Conditioning', 
  'Laundry', 'Gym', 'Pool', 'Security'
];

export function AddPropertyWizard() {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    rent: '',
    currency: 'GBP',
    amenities: [] as string[],
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handlePublish = () => {
    setOpen(false);
    setStep(1);
    setFormData({ title: '', location: '', rent: '', currency: 'GBP', amenities: [] });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[#4A4A68]">Property Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#8C57FF] hover:bg-[#7C47EF]">
              <Plus className="h-4 w-4 mr-2" />
              Add New Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Property - Step {step} of 4</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full ${
                      s <= step ? 'bg-[#8C57FF]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Property Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-[#8C57FF]" />
                    <h3>Property Details</h3>
                  </div>
                  <div className="space-y-2">
                    <Label>Property Title</Label>
                    <Input
                      placeholder="e.g., Modern Downtown Apartment"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., 123 Main St, New York, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Rent</Label>
                      <Input
                        type="number"
                        placeholder="2500"
                        value={formData.rent}
                        onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Upload Photos */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="h-5 w-5 text-[#8C57FF]" />
                    <h3>Upload Photos</h3>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#8C57FF] transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Amenities */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="h-5 w-5 text-[#8C57FF]" />
                    <h3>Select Amenities</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <label
                          htmlFor={amenity}
                          className="text-sm cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Preview */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-[#8C57FF]" />
                    <h3>Preview & Publish</h3>
                  </div>
                  <div className="bg-[#F4F5FA] p-6 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p>{formData.title || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p>{formData.location || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p>{getCurrencySymbol(formData.currency)}{formData.rent || '0'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p>{formData.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amenities</p>
                      <p>{formData.amenities.join(', ') || 'None selected'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                {step < 4 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-[#8C57FF] hover:bg-[#7C47EF]"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    className="bg-[#28C76F] hover:bg-[#24B263]"
                  >
                    Publish Property
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
