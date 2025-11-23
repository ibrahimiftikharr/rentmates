import { useState } from 'react';
import { Save, Home, DollarSign, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/shared/ui/utils';
import { StudentProfile } from '../services/studentService';
import { Checkbox } from '@/shared/ui/checkbox';

interface HousingPreferencesCardProps {
  profile: StudentProfile;
  onUpdate: (updates: Partial<StudentProfile>) => Promise<StudentProfile>;
}

export function HousingPreferencesCard({ profile, onUpdate }: HousingPreferencesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    propertyType: profile.housingPreferences?.propertyType || [],
    budgetMin: profile.housingPreferences?.budgetMin || 0,
    budgetMax: profile.housingPreferences?.budgetMax || 0,
    moveInDate: profile.housingPreferences?.moveInDate ? new Date(profile.housingPreferences.moveInDate) : undefined,
    stayDuration: profile.housingPreferences?.stayDuration || '',
    preferredAreas: profile.housingPreferences?.preferredAreas?.join(', ') || '',
    petsAllowed: profile.housingPreferences?.petsAllowed || false,
    smokingAllowed: profile.housingPreferences?.smokingAllowed || false,
    furnished: profile.housingPreferences?.furnished || false,
    billsIncluded: profile.housingPreferences?.billsIncluded || false,
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate({
        housingPreferences: {
          ...formData,
          preferredAreas: formData.preferredAreas.split(',').map(a => a.trim()).filter(a => a),
        }
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      propertyType: profile.housingPreferences?.propertyType || [],
      budgetMin: profile.housingPreferences?.budgetMin || 0,
      budgetMax: profile.housingPreferences?.budgetMax || 0,
      moveInDate: profile.housingPreferences?.moveInDate ? new Date(profile.housingPreferences.moveInDate) : undefined,
      stayDuration: profile.housingPreferences?.stayDuration || '',
      preferredAreas: profile.housingPreferences?.preferredAreas?.join(', ') || '',
      petsAllowed: profile.housingPreferences?.petsAllowed || false,
      smokingAllowed: profile.housingPreferences?.smokingAllowed || false,
      furnished: profile.housingPreferences?.furnished || false,
      billsIncluded: profile.housingPreferences?.billsIncluded || false,
    });
    setIsEditing(false);
  };

  const propertyTypes = ['Apartment', 'House', 'Studio', 'Shared Room', 'Private Room'];

  const togglePropertyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type]
    }));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Housing Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            Property Type
          </Label>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => togglePropertyType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border transition-colors",
                    formData.propertyType.includes(type)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          ) : (
            <Input 
              value={formData.propertyType.join(', ') || 'Not set'}
              disabled
              className="bg-muted/50 text-sm"
            />
          )}
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetMin" className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Min Budget (£/month)
            </Label>
            <Input 
              id="budgetMin" 
              type="number"
              value={formData.budgetMin}
              onChange={(e) => setFormData({...formData, budgetMin: Number(e.target.value)})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="500"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetMax" className="text-sm">Max Budget (£/month)</Label>
            <Input 
              id="budgetMax" 
              type="number"
              value={formData.budgetMax}
              onChange={(e) => setFormData({...formData, budgetMax: Number(e.target.value)})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="1000"
              min="0"
            />
          </div>
        </div>

        {/* Move-in Date */}
        <div className="space-y-2">
          <Label htmlFor="move-in-date" className="text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Move-in Date
          </Label>
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal text-sm',
                    !formData.moveInDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.moveInDate ? format(formData.moveInDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.moveInDate}
                  onSelect={(date) => {
                    setFormData({...formData, moveInDate: date});
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Input 
              id="move-in-date" 
              value={formData.moveInDate ? format(formData.moveInDate, 'PPP') : 'Not set'}
              disabled
              className="bg-muted/50 text-sm"
            />
          )}
        </div>

        {/* Stay Duration */}
        <div className="space-y-2">
          <Label htmlFor="stayDuration" className="text-sm">Stay Duration</Label>
          <Input 
            id="stayDuration" 
            value={formData.stayDuration}
            onChange={(e) => setFormData({...formData, stayDuration: e.target.value})}
            disabled={!isEditing}
            className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            placeholder="e.g., 6 months, 1 year"
          />
        </div>

        {/* Preferred Areas */}
        <div className="space-y-2">
          <Label htmlFor="preferredAreas" className="text-sm">Preferred Areas (comma-separated)</Label>
          <Input 
            id="preferredAreas" 
            value={formData.preferredAreas}
            onChange={(e) => setFormData({...formData, preferredAreas: e.target.value})}
            disabled={!isEditing}
            className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            placeholder="e.g., City Centre, University District"
          />
        </div>

        {/* Preferences Checkboxes */}
        <div className="space-y-3">
          <Label className="text-sm">Additional Preferences</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="petsAllowed" 
                checked={formData.petsAllowed}
                onCheckedChange={(checked) => setFormData({...formData, petsAllowed: checked as boolean})}
                disabled={!isEditing}
              />
              <Label htmlFor="petsAllowed" className="text-sm font-normal cursor-pointer">
                Pets Allowed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="smokingAllowed" 
                checked={formData.smokingAllowed}
                onCheckedChange={(checked) => setFormData({...formData, smokingAllowed: checked as boolean})}
                disabled={!isEditing}
              />
              <Label htmlFor="smokingAllowed" className="text-sm font-normal cursor-pointer">
                Smoking Allowed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="furnished" 
                checked={formData.furnished}
                onCheckedChange={(checked) => setFormData({...formData, furnished: checked as boolean})}
                disabled={!isEditing}
              />
              <Label htmlFor="furnished" className="text-sm font-normal cursor-pointer">
                Furnished
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="billsIncluded" 
                checked={formData.billsIncluded}
                onCheckedChange={(checked) => setFormData({...formData, billsIncluded: checked as boolean})}
                disabled={!isEditing}
              />
              <Label htmlFor="billsIncluded" className="text-sm font-normal cursor-pointer">
                Bills Included
              </Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
              Edit Preferences
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
