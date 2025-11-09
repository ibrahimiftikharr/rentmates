import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { OTPModal } from './OTPModal';
import { OTPVerification } from './OTPVerification';
import { SuccessMessage } from './SuccessMessage';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export function AuthCard() {
  const [activeTab, setActiveTab] = useState('login');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Signup flow states
  const [signupStep, setSignupStep] = useState<'form' | 'otp' | 'success'>('form');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupData, setSignupData] = useState<{ name: string; email: string; password: string; role: string } | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Called by SignUpForm after initial OTP is sent successfully
  const handleOTPSent = (email: string, data: { name: string; email: string; password: string; role: string }) => {
    setSignupEmail(email);
    setSignupData(data);
    setSignupStep('otp');
  };

  // Called by OTPVerification after OTP is verified; performs final signup
  const handleOTPVerified = async (otp: string) => {
    if (!signupData) {
      toast.error('Signup data missing. Please start again.');
      setSignupStep('form');
      return;
    }
    try {
      setIsSigningUp(true);
      await authService.signup({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role as 'student' | 'landlord',
        otp,
      });
      setSignupStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSuccessContinue = () => {
    // After success we could redirect based on role; for now switch to login tab
    setActiveTab('login');
    setSignupStep('form');
    setSignupEmail('');
    setSignupData(null);
  };

  const handleBackToForm = () => {
    setSignupStep('form');
    setSignupEmail('');
    setSignupData(null);
  };

  return (
    <>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
          {signupStep === 'form' || activeTab === 'login' ? (
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              setSignupStep('form');
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-5 bg-muted">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl mb-1 font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>Welcome back</h2>
                    <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
                  </div>
                  <LoginForm onForgotPassword={() => setForgotPasswordOpen(true)} />
                </div>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl mb-1 font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>Create an account</h2>
                    <p className="text-muted-foreground text-sm">Get started with Rentmates today</p>
                  </div>
                  <SignUpForm onOTPSent={handleOTPSent} />
                </div>
              </TabsContent>
            </Tabs>
          ) : signupStep === 'otp' ? (
            <OTPVerification
              email={signupEmail}
              onVerified={handleOTPVerified}
              onBack={handleBackToForm}
            />
          ) : (
            <SuccessMessage onContinue={handleSuccessContinue} />
          )}
        </div>

        {activeTab === 'login' && signupStep === 'form' && (
          <p className="text-center mt-4 text-muted-foreground text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => setActiveTab('signup')}
              className="text-primary hover:underline"
            >
              Sign up
            </button>
          </p>
        )}
      </div>
      <OTPModal open={otpModalOpen} onClose={() => setOtpModalOpen(false)} />
      <ForgotPasswordModal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
      {signupStep === 'otp' && isSigningUp && (
        <p className="text-center mt-4 text-sm text-muted-foreground">Creating your account...</p>
      )}
    </>
  );
}
