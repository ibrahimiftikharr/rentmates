import { CheckCircle, XCircle, Shield, Award, Mail, Upload, User, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { StudentProfile } from '../services/studentService';

interface VerificationReputationProgressCardProps {
  profile: StudentProfile;
}

export function VerificationReputationProgressCard({ profile }: VerificationReputationProgressCardProps) {
  // Calculate points based on profile completion
  const steps = [
    { 
      id: 'email', 
      title: 'Email Verified', 
      points: 25, 
      completed: true, // Always true since signup requires email verification
      icon: Mail 
    },
    { 
      id: 'profile', 
      title: 'Profile Completed', 
      points: 30, 
      completed: profile.profileSteps?.basicInfo && profile.profileSteps?.housingPreferences && profile.profileSteps?.bioCompleted,
      icon: User 
    },
    { 
      id: 'document', 
      title: 'ID/Passport Uploaded', 
      points: 25, 
      completed: profile.profileSteps?.documentsUploaded,
      icon: Upload 
    },
    { 
      id: 'wallet', 
      title: 'Wallet Linked', 
      points: 20, 
      completed: profile.walletLinked,
      icon: LinkIcon 
    },
  ];

  const totalPoints = 100; // 25 + 30 + 25 + 20
  const earnedPoints = profile.reputationScore || 25; // At minimum email is verified
  const progressPercentage = (earnedPoints / totalPoints) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span>Verification & Reputation Progress</span>
            </CardTitle>
            <CardDescription className="mt-2 text-sm">
              Complete all steps to maximize your reputation score (max 100 points)
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-semibold text-primary">{Math.round(progressPercentage)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>{earnedPoints} / {totalPoints} points earned</span>
            <span>{steps.filter(s => s.completed).length} / {steps.length} steps</span>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all ${
                step.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm sm:text-base truncate ${step.completed ? 'text-green-900' : ''}`}>
                    {step.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {step.completed ? 'Completed' : 'Not completed'}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    +{step.points} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {progressPercentage === 100 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-green-900 text-sm sm:text-base">Congratulations! 🎉</p>
                <p className="text-xs sm:text-sm text-green-700">
                  You're now a Fully Verified Member with maximum reputation score
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
