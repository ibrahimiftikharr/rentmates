import { useState, useEffect } from "react";
import { User, Upload, CheckCircle2, Clock, FileText, Bell, Camera, Mail, Shield, Star, DollarSign, BarChart3, AlertCircle, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { investorService, InvestorProfile } from "../services/investorService";

export function ProfilePage() {
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [govDocument, setGovDocument] = useState<string>("");
  const [isVerified, setIsVerified] = useState(false);
  const [isUploading, setIsUploading] = useState<'photo' | 'document' | null>(null);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    loanRepayment: true,
    poolPerformance: true,
    defaultAlerts: true,
    earningsCredits: true
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await investorService.getProfile();
      setProfile(data);
      setProfilePhoto(data.profileImage || "");
      setGovDocument(data.govIdDocument || "");
      setIsVerified(data.isVerified || false);
    } catch (error: any) {
      toast.error("Failed to load profile", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Profile photo must be less than 5MB"
      });
      return;
    }

    try {
      setIsUploading('photo');
      const imageUrl = await investorService.uploadProfileImage(file);
      setProfilePhoto(imageUrl);
      toast.success("Profile photo updated successfully!");
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Document must be less than 10MB"
      });
      return;
    }

    try {
      setIsUploading('document');
      const result = await investorService.uploadGovIdDocument(file);
      setGovDocument(result.documentUrl);
      setIsVerified(result.isVerified);
      toast.success("Document uploaded successfully!", {
        description: "Your account is now verified"
      });
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      await investorService.deleteProfileImage();
      setProfilePhoto("");
      toast.success("Profile photo deleted");
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message
      });
    }
  };

  const handleDeleteDocument = async () => {
    try {
      const newVerificationStatus = await investorService.deleteGovIdDocument();
      setGovDocument("");
      setIsVerified(newVerificationStatus);
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message
      });
    }
  };

  const handleNotificationToggle = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-[#7367F0] p-4 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-3 md:gap-4">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
            <User className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-white mb-1 md:mb-2 text-xl md:text-2xl">Profile Settings</h2>
            <p className="text-white/90 text-xs md:text-sm">
              Manage your account, verification documents, and preferences
            </p>
          </div>
          {isVerified && (
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 text-xs">
              <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 fill-white" />
              Premium Investor
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Overview Section */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-purple-50/50">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          {/* Profile Photo Section - Centered */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="h-36 w-36 rounded-full bg-gradient-to-br from-primary/10 to-purple-100 p-1 shadow-lg">
                <div className="h-full w-full rounded-full bg-white border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-16 w-16 text-primary/60" />
                  )}
                </div>
              </div>
              <label htmlFor="profile-photo" className="absolute bottom-1 right-1 bg-primary rounded-full p-2.5 shadow-lg border-2 border-white cursor-pointer hover:bg-primary/90 transition-all hover:scale-105">
                {isUploading === 'photo' ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </label>
              {profilePhoto && (
                <button
                  onClick={handleDeleteProfilePhoto}
                  className="absolute bottom-1 left-1 bg-red-500 rounded-full p-2.5 shadow-lg border-2 border-white hover:bg-red-600 transition-all hover:scale-105"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Input
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleProfilePhotoChange}
                className="hidden"
                disabled={isUploading === 'photo'}
              />
              <p className="text-xs text-muted-foreground">
                JPG or PNG • Max 5MB
              </p>
            </div>
          </div>

          {/* Investor Status Badge - Centered */}
          <div className="flex justify-center mb-8">
            {isVerified ? (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">Verified Investor</p>
                  <p className="text-xs text-green-600">Account fully verified</p>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Verification Pending</p>
                  <p className="text-xs text-amber-600">Upload documents to verify</p>
                </div>
              </div>
            )}
          </div>

          {/* Account Information - Vertical Layout */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-purple-50/40 rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    value={profile?.name || ''}
                    disabled
                    className="bg-purple-50/50 cursor-not-allowed border-purple-200"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Locked after identity verification
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/40 rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-purple-50/50 cursor-not-allowed border-purple-200"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Verified email cannot be changed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification Section */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-orange-50/30">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-orange-50/50 to-amber-50/30">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Identity Verification
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            Upload your identification documents for KYC compliance
          </p>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {/* Government ID / Driver's License Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                1
              </div>
              <Label className="font-semibold">
                Government ID / Driver's License
              </Label>
            </div>
            
            <div className="border-3 border-dashed rounded-2xl p-8 hover:border-primary/70 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white shadow-inner" style={{ borderWidth: '3px' }}>
              {govDocument ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">Government ID / Driver's License</p>
                        <p className="text-xs text-green-700">Document uploaded</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white border-0 px-3 py-1.5 shadow-md">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Verified
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteDocument}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center">
                    {isUploading === 'document' ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <p className="mb-2">
                    <Label htmlFor="id-document" className="text-primary cursor-pointer hover:underline font-semibold">
                      Click to upload
                    </Label>
                    {" "}or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Government ID or Driver's License • PNG, JPG or PDF • Maximum 10MB
                  </p>
                </div>
              )}
            </div>
            
            <Input
              id="id-document"
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={handleDocumentUpload}
              className="hidden"
              disabled={isUploading === 'document'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-purple-50/50 to-pink-50/30">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            Notification Preferences
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            Customize which notifications you want to receive
          </p>
        </CardHeader>
        <CardContent className="pt-8 space-y-4">
          <div className="flex items-center justify-between p-5 rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 shadow-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Loan Repayment Updates</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when borrowers make loan repayments
                </p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.loanRepayment}
              onCheckedChange={() => handleNotificationToggle("loanRepayment")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Pool Performance Updates</p>
                <p className="text-xs text-muted-foreground">
                  Receive updates about your investment pool performance
                </p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.poolPerformance}
              onCheckedChange={() => handleNotificationToggle("poolPerformance")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-white to-red-50/30 shadow-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Default / Liquidation Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Important alerts about defaults and liquidations
                </p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.defaultAlerts}
              onCheckedChange={() => handleNotificationToggle("defaultAlerts")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-white to-yellow-50/30 shadow-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Earnings Credited Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when earnings are credited to your wallet
                </p>
              </div>
            </div>
            <Switch
              checked={notificationPrefs.earningsCredits}
              onCheckedChange={() => handleNotificationToggle("earningsCredits")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}