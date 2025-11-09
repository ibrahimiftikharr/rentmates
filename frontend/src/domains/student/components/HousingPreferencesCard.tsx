import { useState } from 'react';
import { Save, Home, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/shared/ui/utils';

export function HousingPreferencesCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookingFor, setLookingFor] = useState('Shared flat near campus');
  const [budget, setBudget] = useState('£600-800/month');
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(new Date('2025-09-01'));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Housing preferences updated successfully!');
    }, 1000);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Housing Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Looking For */}
          <div className="space-y-2">
            <Label htmlFor="looking-for" className="text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Looking For
            </Label>
            <Input 
              id="looking-for" 
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., Shared flat near campus"
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Budget
            </Label>
            <Input 
              id="budget" 
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., £600-800/month"
            />
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="move-in-date" className="text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Move-in Date
            </Label>
            {isEditing ? (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal text-sm',
                      !moveInDate && 'text-muted-foreground'
                    )}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCalendarOpen(true);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveInDate ? format(moveInDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={moveInDate}
                    onSelect={(date) => {
                      setMoveInDate(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Input 
                id="move-in-date" 
                value={moveInDate ? format(moveInDate, 'MMMM yyyy') : ''}
                disabled
                className="bg-muted/50 text-sm"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {!isEditing ? (
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => setIsEditing(true)}
            >
              Edit Preferences
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
