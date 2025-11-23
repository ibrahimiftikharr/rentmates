import { useState, useEffect } from 'react';
import { ProfileInfoCard } from '../components/ProfileInfoCard';
import { HousingPreferencesCard } from '../components/HousingPreferencesCard';
import { DocumentUploadCard } from '../components/DocumentUploadCard';
import { VerificationReputationProgressCard } from '../components/VerificationReputationProgressCard';
import { ReputationScoreSummaryCard } from '../components/ReputationScoreSummaryCard';
import { Card, CardContent } from '@/shared/ui/card';
import { Shield, TrendingUp, Zap, Star, Loader2 } from 'lucide-react';
import { studentService, StudentProfile } from '../services/studentService';
import { toast } from 'sonner';

export function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await studentService.getProfile();
      setProfile(data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updates: Partial<StudentProfile>) => {
    try {
      const updatedProfile = await studentService.updateProfile(updates);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      const result = await studentService.uploadDocument(file, documentType);
      toast.success('Document uploaded successfully');
      // Refresh profile to get updated reputation score
      await fetchProfile();
      return result;
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      toast.error(error.message || 'Failed to upload document');
      throw error;
    }
  };

  const handleDocumentDelete = async (documentType: string) => {
    try {
      await studentService.deleteDocument(documentType);
      toast.success('Document deleted successfully');
      // Refresh profile to get updated reputation score
      await fetchProfile();
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      toast.error(error.message || 'Failed to delete document');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2">My Profile</h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Complete verification to unlock full platform access and build your reputation.
        </p>
      </div>

      {/* Section 1: Profile Information */}
      <ProfileInfoCard profile={profile} onUpdate={handleProfileUpdate} />

      {/* Section 2: Housing Preferences */}
      <HousingPreferencesCard profile={profile} onUpdate={handleProfileUpdate} />

      {/* Section 3: Document Upload */}
      <DocumentUploadCard 
        profile={profile} 
        onUpload={handleDocumentUpload}
        onDelete={handleDocumentDelete}
      />

      {/* Section 4: Verification & Reputation Progress */}
      <VerificationReputationProgressCard profile={profile} />

      {/* Section 5: Reputation Score Summary */}
      <ReputationScoreSummaryCard profile={profile} />

      {/* Section 6: Benefits of Verification */}
      <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Benefits of Full Verification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                icon: Shield, 
                title: 'Increased Trust with Landlords', 
                desc: 'Build credibility and stand out from other applicants',
                color: 'text-blue-600',
                bgColor: 'bg-blue-100'
              },
              { 
                icon: Zap, 
                title: 'Access to Premium Listings', 
                desc: 'Unlock exclusive properties and early access',
                color: 'text-purple-600',
                bgColor: 'bg-purple-100'
              },
              { 
                icon: TrendingUp, 
                title: 'Faster Loan Approvals', 
                desc: 'Get approved quickly for rental deposits and loans',
                color: 'text-green-600',
                bgColor: 'bg-green-100'
              },
              { 
                icon: Star, 
                title: 'Reputation Boost', 
                desc: 'Earn bonus points and climb the trust rankings',
                color: 'text-orange-600',
                bgColor: 'bg-orange-100'
              },
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${benefit.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                </div>
                <div>
                  <p className="font-medium mb-1">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
