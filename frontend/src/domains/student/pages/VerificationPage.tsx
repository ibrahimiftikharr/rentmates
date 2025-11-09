import { KYCVerificationCard } from '../components/KYCVerificationCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

export function VerificationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="mb-2">Identity Verification</h1>
        <p className="text-muted-foreground">
          Complete your KYC process to unlock all features
        </p>
      </div>

      {/* Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Why verify your identity?</AlertTitle>
        <AlertDescription className="text-blue-800">
          Verification helps build trust in the community and unlocks premium features like higher rental bids and priority support.
        </AlertDescription>
      </Alert>

      {/* KYC Card */}
      <KYCVerificationCard />

      {/* Benefits Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verification Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Increased Trust', desc: 'Build credibility with landlords' },
              { title: 'Priority Support', desc: 'Get faster response times' },
              { title: 'Higher Limits', desc: 'Access to premium listings' },
              { title: 'Reputation Boost', desc: '+10 points to your score' },
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary">✓</span>
                </div>
                <div>
                  <p className="font-medium">{benefit.title}</p>
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
