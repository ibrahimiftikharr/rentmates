import { useState, KeyboardEvent } from 'react';
import { Camera, Save, CheckCircle, Mail, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';

export function ProfileInfoCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [interests, setInterests] = useState<string[]>(['Coding', 'Gaming', 'Photography']);
  const [currentInterest, setCurrentInterest] = useState('');
  const [degree, setDegree] = useState('Computer Science');
  const [yearOfDegree, setYearOfDegree] = useState('3rd Year');
  const [aboutMe, setAboutMe] = useState('Passionate about technology and innovation. Love coding late into the night and always up for a good study session.');
  const [phoneNumber, setPhoneNumber] = useState('+44 7700 900123');
  const [govIdNumber, setGovIdNumber] = useState('3410625622826');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  const handleVerifyEmail = () => {
    toast.success('Verification email sent!');
    setTimeout(() => {
      setEmailVerified(true);
      toast.success('Email verified successfully!');
    }, 2000);
  };

  const handleInterestKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedInterest = currentInterest.trim();
      
      if (!trimmedInterest) {
        return;
      }

      if (interests.length >= 5) {
        toast.error('You can only add up to 5 interests');
        return;
      }

      if (interests.includes(trimmedInterest)) {
        toast.error('This interest has already been added');
        return;
      }

      setInterests([...interests, trimmedInterest]);
      setCurrentInterest('');
    }
  };

  const removeInterest = (indexToRemove: number) => {
    setInterests(interests.filter((_, index) => index !== indexToRemove));
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
              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" />
              <AvatarFallback>JD</AvatarFallback>
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
              defaultValue="Jessica Davis" 
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                defaultValue="jessica.davis@university.edu" 
                disabled={!isEditing}
                className={`${!isEditing ? 'bg-muted/50' : ''} pr-20 sm:pr-24 text-sm`}
              />
              {emailVerified ? (
                <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Verified</span>
                  <span className="sm:hidden">✓</span>
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary hover:text-primary px-2"
                  onClick={handleVerifyEmail}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Verify</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university" className="text-sm">University</Label>
            <Input 
              id="university" 
              defaultValue="Stanford University" 
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality" className="text-sm">Nationality</Label>
            <Input 
              id="nationality" 
              defaultValue="United States" 
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob" className="text-sm">Date of Birth</Label>
            <Input 
              id="dob" 
              type="date" 
              defaultValue="2002-03-15" 
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-id" className="text-sm">Student ID (Optional)</Label>
            <Input 
              id="student-id" 
              defaultValue="STU2024-789456" 
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
            />
          </div>

          {/* NEW FIELD: Degree */}
          <div className="space-y-2">
            <Label htmlFor="degree" className="text-sm">Degree</Label>
            <Input 
              id="degree" 
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., Computer Science"
            />
          </div>

          {/* NEW FIELD: Year of Degree */}
          <div className="space-y-2">
            <Label htmlFor="year-of-degree" className="text-sm">Year of Degree</Label>
            {isEditing ? (
              <Select value={yearOfDegree} onValueChange={setYearOfDegree}>
                <SelectTrigger id="year-of-degree" className="text-sm">
                  <SelectValue />
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
                id="year-of-degree" 
                value={yearOfDegree}
                disabled
                className="bg-muted/50 text-sm"
              />
            )}
          </div>

          {/* NEW FIELD: Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., +44 7700 900123"
            />
          </div>

          {/* NEW FIELD: Government Issued ID */}
          <div className="space-y-2">
            <Label htmlFor="gov-id" className="text-sm">Government Issued ID Number</Label>
            <Input 
              id="gov-id" 
              value={govIdNumber}
              onChange={(e) => setGovIdNumber(e.target.value)}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-muted/50' : ''} text-sm`}
              placeholder="e.g., 3410625622826"
            />
          </div>
        </div>

        {/* NEW FIELD: About Me */}
        <div className="space-y-2">
          <Label htmlFor="about-me" className="text-sm">About Me</Label>
          <Textarea 
            id="about-me" 
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            disabled={!isEditing}
            className={`${!isEditing ? 'bg-muted/50' : ''} text-sm min-h-[100px]`}
            placeholder="Tell us about yourself..."
            rows={4}
          />
          {isEditing && (
            <p className="text-xs text-muted-foreground">
              {aboutMe.length} characters
            </p>
          )}
        </div>

        {/* NEW FIELD: Interests and Hobbies */}
        <div className="space-y-2">
          <Label htmlFor="interests" className="text-sm">Interests & Hobbies</Label>
          <div className="space-y-3">
            {/* Tags/Chips Display */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                {interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-sm border border-primary/20 flex items-center gap-2"
                  >
                    {interest}
                    {isEditing && (
                      <button
                        onClick={() => removeInterest(index)}
                        className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Input Field */}
            {isEditing && (
              <div className="space-y-2">
                <Input 
                  id="interests" 
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyDown={handleInterestKeyDown}
                  placeholder={interests.length >= 5 ? "Maximum 5 interests reached" : "Type an interest and press Enter"}
                  disabled={interests.length >= 5}
                  className={interests.length >= 5 ? 'bg-muted/50' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  {interests.length}/5 interests added. Press Enter to add each interest.
                </p>
              </div>
            )}

            {!isEditing && interests.length === 0 && (
              <p className="text-sm text-muted-foreground italic p-3 border rounded-lg bg-muted/20">
                No interests added yet
              </p>
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
              Edit Profile
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
