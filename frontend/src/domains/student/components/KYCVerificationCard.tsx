import { useState } from 'react';
import { Upload, Camera, Check, Clock, X, Shield, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

type StepStatus = 'completed' | 'pending' | 'rejected';

interface VerificationStep {
  id: string;
  title: string;
  icon: any;
  status: StepStatus;
}

export function KYCVerificationCard() {
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: '1', title: 'Upload ID Document', icon: Upload, status: 'completed' },
    { id: '2', title: 'Selfie Verification', icon: Camera, status: 'completed' },
    { id: '3', title: 'Blockchain Confirmation', icon: Shield, status: 'pending' },
  ]);

  const [blockchainHash] = useState('0x7a4f...9c2e');

  const handleVerifyOnBlockchain = () => {
    toast.success('Blockchain verification initiated!');
    setTimeout(() => {
      setSteps(prev => prev.map(step => 
        step.id === '3' ? { ...step, status: 'completed' as StepStatus } : step
      ));
      toast.success('Verification confirmed on blockchain!');
    }, 2000);
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: StepStatus) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          KYC Verification Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              {/* Step Number */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === 'completed' 
                  ? 'bg-green-100 text-green-600' 
                  : step.status === 'pending'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{step.title}</p>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(step.status)}
                  >
                    {getStatusIcon(step.status)}
                    <span className="ml-1">{getStatusText(step.status)}</span>
                  </Badge>
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-2 ml-5 w-0.5 h-6 bg-border"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain Hash */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Blockchain Hash</span>
            <button className="text-primary hover:underline flex items-center gap-1">
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="font-mono bg-card px-3 py-2 rounded border border-border flex items-center justify-between">
            <span>{blockchainHash}</span>
            <Check className="w-4 h-4 text-green-600" />
          </div>
        </div>

        {/* Verify Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleVerifyOnBlockchain}
          disabled={steps.every(s => s.status === 'completed')}
        >
          <Shield className="w-4 h-4 mr-2" />
          {steps.every(s => s.status === 'completed') ? 'Verified on Blockchain' : 'Verify on Blockchain'}
        </Button>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground text-center">
          Your verification status is securely stored on the blockchain
        </p>
      </CardContent>
    </Card>
  );
}
