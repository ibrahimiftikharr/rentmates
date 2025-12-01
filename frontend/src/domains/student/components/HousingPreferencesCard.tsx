import { useState } from 'react';
import { Save, Home, DollarSign, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/ui/utils';
import { StudentProfile } from '../services/studentService';

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
    moveInDate: profile.housingPreferences?.moveInDate ? new Date(profile.housingPreferences.moveInDate).toISOString().split('T')[0] : '',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate({
        housingPreferences: formData
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
      moveInDate: profile.housingPreferences?.moveInDate ? new Date(profile.housingPreferences.moveInDate).toISOString().split('T')[0] : '',
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
          <Input 
            id="move-in-date" 
            type="date"
            value={formData.moveInDate}
            onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
            disabled={!isEditing}
            className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
          />
          {isEditing && (
            <p className="text-xs text-muted-foreground">Must be a future date</p>
          )}
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
