import { useState } from 'react';
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
import { User, Bell, Lock, Shield, Eye, Upload, Info, FileText, Star } from 'lucide-react';

export function SettingsPage() {
  const [uploadedFileName, setUploadedFileName] = useState('drivers_license.pdf');
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'not-submitted'>('verified');
  const reputationScore = 4.5; // Out of 5

  const getKycBadge = () => {
    switch (kycStatus) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">✅ Verified</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">⏳ Pending</Badge>;
      case 'not-submitted':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">❌ Not Submitted</Badge>;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
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
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=landlord" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto">
                    Change Photo
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
                            Your reputation is based on tenant reviews, property maintenance, and timely responses.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.floor(reputationScore)
                            ? 'fill-yellow-400 text-yellow-400'
                            : star - 0.5 <= reputationScore
                            ? 'fill-yellow-400/50 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-[#4A4A68]">{reputationScore}/5</span>
                  </div>
                </div>
                <Progress value={(reputationScore / 5) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Excellent reputation! Keep up the great work.
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="john.doe@email.com" />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" defaultValue="+1 (555) 123-4567" />
              </div>

              <div className="space-y-2">
                <Label>Nationality</Label>
                <Select defaultValue="us">
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="au">🇦🇺 Australia</SelectItem>
                    <SelectItem value="de">🇩🇪 Germany</SelectItem>
                    <SelectItem value="fr">🇫🇷 France</SelectItem>
                    <SelectItem value="es">🇪🇸 Spain</SelectItem>
                    <SelectItem value="in">🇮🇳 India</SelectItem>
                    <SelectItem value="cn">🇨🇳 China</SelectItem>
                    <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* KYC Verification */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8C57FF]" />
                <CardTitle className="text-[#4A4A68]">KYC Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label>Government Issued ID Number</Label>
                <Input type="text" placeholder="Enter your ID number" defaultValue="3410625622826" />
                <p className="text-xs text-muted-foreground">
                  This will be used for contract verification purposes
                </p>
              </div>

              {/* KYC Verification Status */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>KYC Verification Status</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="focus:outline-none">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">
                            Know Your Customer (KYC) verification helps ensure trust and security on the platform. Upload a valid ID document for verification.
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
                    ID / Driver's License
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 px-4 py-2 bg-[#F4F5FA] rounded-lg border border-border">
                      <p className="text-sm text-[#4A4A68] truncate">{uploadedFileName}</p>
                    </div>
                    <input
                      type="file"
                      id="id-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('id-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG up to 10MB. Ensure all details are clearly visible.
                  </p>
                </div>
              </div>

              <Button className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto">
                Update KYC Information
              </Button>
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
