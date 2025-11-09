import { useState } from 'react';
import { CheckCircle, Clock, XCircle, ChevronRight, Shield, Award, Wallet as WalletIcon, Mail, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { toast } from 'sonner';

type StepStatus = 'completed' | 'pending' | 'incomplete';

interface VerificationStep {
  id: string;
  title: string;
  points: number;
  status: StepStatus;
  icon: any;
  action?: string;
}

export function VerificationReputationProgressCard() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 'profile', title: 'Profile Completed', points: 5, status: 'completed', icon: CheckCircle },
    { id: 'email', title: 'Email Verified', points: 3, status: 'completed', icon: Mail },
    { id: 'document', title: 'ID/Passport Uploaded', points: 10, status: 'pending', icon: Upload, action: 'Upload Document' },
    { id: 'wallet', title: 'Wallet Linked', points: 8, status: 'incomplete', icon: WalletIcon, action: 'Link Wallet' },
  ]);

  const totalPoints = steps.reduce((sum, step) => sum + step.points, 0);
  const earnedPoints = steps
    .filter(step => step.status === 'completed')
    .reduce((sum, step) => sum + step.points, 0);
  const progressPercentage = (earnedPoints / totalPoints) * 100;

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'incomplete':
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-orange-50 border-orange-200';
      case 'incomplete':
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleStepClick = (step: VerificationStep) => {
    if (step.status !== 'completed') {
      setOpenDialog(step.id);
    }
  };

  const handleAction = (stepId: string) => {
    if (stepId === 'document') {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: 'completed' as StepStatus } : s
      ));
      toast.success('Document uploaded successfully! +10 points');
    } else if (stepId === 'wallet') {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: 'completed' as StepStatus } : s
      ));
      toast.success('Wallet linked successfully! +8 points');
    }
    setOpenDialog(null);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span>Verification & Reputation Progress</span>
              </CardTitle>
              <CardDescription className="mt-2 text-sm">
                Complete all steps to become a Fully Verified Member
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
              <span>{steps.filter(s => s.status === 'completed').length} / {steps.length} steps</span>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div 
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusColor(step.status)}`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm sm:text-base truncate ${step.status === 'completed' ? 'text-green-900' : ''}`}>
                        {step.title}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {step.status === 'completed' ? 'Completed' : step.action || 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                        step.status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        +{step.points} pts
                      </div>
                      {step.status !== 'completed' && (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      )}
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
                    You're now a Fully Verified Member with full platform access
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={openDialog === 'document'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload ID/Passport</DialogTitle>
            <DialogDescription>
              Upload a clear photo of your ID or passport to earn +10 reputation points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG (max. 5MB)</p>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleAction('document')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === 'wallet'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Your Wallet</DialogTitle>
            <DialogDescription>
              Connect your MetaMask wallet to earn +8 reputation points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="font-medium mb-1">Connect MetaMask Wallet</p>
              <p className="text-sm text-muted-foreground">
                This will securely link your wallet to your profile
              </p>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleAction('wallet')}
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Link Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
