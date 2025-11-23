import { useState } from 'react';
import { Camera, Save, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StudentProfile } from '../services/studentService';

interface ProfileInfoCardProps {
  profile: StudentProfile;
  onUpdate: (updates: Partial<StudentProfile>) => Promise<StudentProfile>;
}

export function ProfileInfoCard({ profile, onUpdate }: ProfileInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    university: profile.university || '',
    course: profile.course || '',
    yearOfStudy: profile.yearOfStudy || '',
    nationality: profile.nationality || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    phone: profile.phone || '',
    bio: profile.bio || ''
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      university: profile.university || '',
      course: profile.course || '',
      yearOfStudy: profile.yearOfStudy || '',
      nationality: profile.nationality || '',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      phone: profile.phone || '',
      bio: profile.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Photo */}
        <div className="flex justify-center">
          <div className="relative group">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
              <AvatarImage src={profile.documents?.profileImage} />
              <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Full Name</Label>
            <Input 
              id="name" 
              value={profile.name}
              disabled
              className="bg-muted/50 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                value={profile.email}
                disabled
                className="bg-muted/50 pr-20 sm:pr-24 text-sm"
              />
              <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">✓</span>
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university" className="text-sm">University</Label>
            <Input 
              id="university" 
              value={formData.university}
              onChange={(e) => setFormData({...formData, university: e.target.value})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="Enter your university"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course" className="text-sm">Course</Label>
            <Input 
              id="course" 
              value={formData.course}
              onChange={(e) => setFormData({...formData, course: e.target.value})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearOfStudy" className="text-sm">Year of Study</Label>
            {isEditing ? (
              <Select value={formData.yearOfStudy} onValueChange={(value) => setFormData({...formData, yearOfStudy: value})}>
                <SelectTrigger id="yearOfStudy" className="text-sm">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input 
                value={formData.yearOfStudy || 'Not set'}
                disabled
                className="bg-muted/50 text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality" className="text-sm">Nationality</Label>
            <Input 
              id="nationality" 
              value={formData.nationality}
              onChange={(e) => setFormData({...formData, nationality: e.target.value})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="Enter your nationality"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth</Label>
            <Input 
              id="dateOfBirth" 
              type="date" 
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="+44 7700 900000"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm">About Me</Label>
          <Textarea 
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            disabled={!isEditing}
            className={`${!isEditing ? 'bg-muted/50' : ''} min-h-[100px] text-sm resize-none`}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          {isEditing && (
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/500 characters
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
              Edit Profile
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
