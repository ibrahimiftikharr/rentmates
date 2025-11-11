import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { User, Bell, Lock, Shield, Eye, Upload, Info, FileText, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { landlordService, LandlordProfile } from '../services/landlordService';
import { toast } from 'sonner';
import PlacesAutocomplete from 'react-places-autocomplete';
import { GoogleMapsLoader } from '@/shared/components/GoogleMapsLoader';

export function SettingsPage() {
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Form state - only required fields
  const [formData, setFormData] = useState({
    phone: '',
    nationality: '',
    address: '',
    governmentId: '',
  });

  // Profile image and document state
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [govIdDocumentFile, setGovIdDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await landlordService.getProfile();
      setProfile(data);
      setFormData({
        phone: data.phone || '',
        nationality: data.nationality || '',
        address: data.address || '',
        governmentId: data.governmentId || '',
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Required: phone, nationality, address, and profile image
    return (
      formData.phone.trim() !== '' &&
      formData.nationality.trim() !== '' &&
      formData.address.trim() !== '' &&
      profile?.profileImage !== ''
    );
  };


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await landlordService.updateProfile(formData);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPG and PNG images are allowed');
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await landlordService.uploadProfileImage(file);
      setProfile((prev) => prev ? { ...prev, profileImage: imageUrl } : null);
      toast.success('Profile image updated!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGovIdDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document must be less than 10MB');
      return;
    }

    // Validate file type
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    try {
      setUploadingDocument(true);
      const documentUrl = await landlordService.uploadGovIdDocument(file);
      setProfile((prev) => prev ? { ...prev, govIdDocument: documentUrl } : null);
      setGovIdDocumentFile(file);
      toast.success('Government ID document uploaded!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingDocument(false);
    }
  };

  const getKycBadge = () => {
    if (!profile) return null;

    if (profile.govIdDocument) {
      return <Badge className="bg-green-500/10 text-green-700 border-green-200">✅ Verified</Badge>;
    } else {
      return <Badge className="bg-red-500/10 text-red-700 border-red-200">❌ Not Submitted</Badge>;
    }
  };

  const getReputationMessage = () => {
    if (!profile) return '';
    const score = profile.reputationScore;
    if (score >= 80) return 'Excellent reputation! Keep up the great work.';
    if (score >= 60) return 'Good reputation. Continue providing quality service.';
    if (score >= 40) return 'Fair reputation. Consider improving your service.';
    return 'Build your reputation by maintaining properties and responding promptly.';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#8C57FF]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Removed - using handleGovIdDocumentUpload instead
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-[#4A4A68] mb-2">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Profile Information */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#8C57FF]" />
                <CardTitle className="text-[#4A4A68]">Profile Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} />
                  <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleProfileImageUpload}
                    disabled={uploadingImage}
                  />
                  <Button
                    className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto"
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Change Photo'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </div>

              {/* Reputation Score */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Reputation Score
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="focus:outline-none">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">
                            Your reputation is based on tenant reviews, property maintenance, and timely responses. Score ranges from 0-100.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#8C57FF]">{profile.reputationScore}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <Progress value={profile.reputationScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {getReputationMessage()}
                </p>
              </div>

              {/* Profile Completion Status */}
              {!profile.isProfileComplete && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Complete Your Profile to Add Properties
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Required: Phone number, Nationality, Address, and Profile Photo. KYC verification is optional but boosts your reputation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile.isProfileComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Profile Complete!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        You can now add properties to your portfolio.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.name} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">
                  Name is managed through your account settings
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={profile.email} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">
                  Email is managed through your account settings
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                    <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                    <SelectItem value="FR">🇫🇷 France</SelectItem>
                    <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                    <SelectItem value="IN">🇮🇳 India</SelectItem>
                    <SelectItem value="CN">🇨🇳 China</SelectItem>
                    <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address Field with Autocomplete */}
              <div className="space-y-2">
                <Label>Address *</Label>
                <GoogleMapsLoader fallback={
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Loading Google Maps..."
                    disabled
                  />
                }>
                  <PlacesAutocomplete
                    value={formData.address}
                    onChange={(value) => handleInputChange('address', value)}
                    onSelect={(value) => handleInputChange('address', value)}
                  >
                    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          {...getInputProps({ placeholder: 'Start typing your address...' })}
                          className="pl-10"
                        />
                        {(loading || suggestions.length > 0) && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loading && <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>}
                            {suggestions.map((suggestion) => (
                              <div
                                {...getSuggestionItemProps(suggestion, {
                                  className: `px-4 py-3 cursor-pointer text-sm border-b last:border-b-0 ${
                                    suggestion.active ? 'bg-gray-50' : 'bg-white'
                                  }`,
                                })}
                                key={suggestion.placeId}
                              >
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-[#8C57FF] mt-0.5 flex-shrink-0" />
                                  <span>{suggestion.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </PlacesAutocomplete>
                </GoogleMapsLoader>
              </div>

              <div className="space-y-2">
                <Label>Government ID Number (Optional)</Label>
                <Input
                  type="text"
                  placeholder="Enter your ID number"
                  value={formData.governmentId}
                  onChange={(e) => handleInputChange('governmentId', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional - helps with verification
                </p>
              </div>

              <Button
                className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto"
                onClick={handleSaveProfile}
                disabled={!isFormValid() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* KYC Verification */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8C57FF]" />
                <div>
                  <CardTitle className="text-[#4A4A68]">KYC Verification (Optional)</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Boost your reputation score by verifying your identity
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* KYC Verification Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Verification Status</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="focus:outline-none">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">
                            Uploading a government ID and document increases your reputation score and builds trust with tenants. This is optional but highly recommended.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {getKycBadge()}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#8C57FF]" />
                    ID / Driver's License (Optional)
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 px-4 py-2 bg-[#F4F5FA] rounded-lg border border-border">
                      <p className="text-sm text-[#4A4A68] truncate">
                        {profile.govIdDocument ? (
                          <a
                            href={profile.govIdDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8C57FF] hover:underline"
                          >
                            {govIdDocumentFile?.name || 'View Document'}
                          </a>
                        ) : (
                          'No document uploaded'
                        )}
                      </p>
                    </div>
                    <input
                      type="file"
                      id="id-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleGovIdDocumentUpload}
                      disabled={uploadingDocument}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('id-upload')?.click()}
                      className="w-full sm:w-auto"
                      disabled={uploadingDocument}
                    >
                      {uploadingDocument ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {profile.govIdDocument ? 'Replace' : 'Upload'}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG up to 10MB. Ensure all details are clearly visible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#8C57FF]" />
                <CardTitle className="text-[#4A4A68]">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <Button className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Notification Preferences */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#8C57FF]" />
                <div>
                  <CardTitle className="text-[#4A4A68]">Notification Preferences</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage how you receive notifications
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive important updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Rental Bids & Offers</p>
                  <p className="text-xs text-muted-foreground">Alerts for new rental bids and offers</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Message Alerts</p>
                  <p className="text-xs text-muted-foreground">Alerts when you receive new messages</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#8C57FF]" />
                <div>
                  <CardTitle className="text-[#4A4A68]">Privacy Settings</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Control who can see your information
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Display Nationality</p>
                  <p className="text-xs text-muted-foreground">Show your nationality on public profile</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Display Email</p>
                  <p className="text-xs text-muted-foreground">Display your email on your public profile</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#4A4A68]">Display Phone Number</p>
                  <p className="text-xs text-muted-foreground">Display your phone number on your public profile</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
