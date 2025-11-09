import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface OTPVerificationProps {
  email: string;
  // Return the OTP that was successfully verified so parent can proceed to signup
  onVerified: (otp: string) => void;
  onBack: () => void;
}

export function OTPVerification({ email, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Removed auto-send OTP here because it is already sent in SignUpForm before navigating to this step.

  useEffect(() => {
    // Countdown timer for enabling resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      await authService.sendOTP(email, true);
      setCountdown(60);
      setCanResend(false);
      toast.success('OTP sent successfully');
    } catch (error) {
      // If the server responds with a 429 or other message, show it
      const msg = (error as any)?.message || 'Failed to resend OTP';
      toast.error(msg);
      console.error('Error resending OTP:', error);
    } finally {
      setIsResending(false);
    }
  };

  // Wrapper for button click to avoid passing the click event into handleVerifyOTP
  const handleVerifyClick = () => {
    void handleVerifyOTP();
  };

  // Accept an optional otpArray to avoid race conditions when verifying immediately
  const handleVerifyOTP = async (otpArray?: string[]) => {
    try {
      setIsLoading(true);
      setError('');

      const source = otpArray ?? otp;
      const otpString = source.join('');
      if (otpString.length !== 6) {
        setError('Please enter all 6 digits');
        return;
      }

  await authService.verifyOTP({ email, otp: otpString });
  onVerified(otpString); // Pass OTP to parent so it can complete signup
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input or verify when complete
    if (value) {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Auto verify when all digits are entered. Pass newOtp to avoid state update race.
        const allDigitsEntered = newOtp.every(digit => digit);
        if (allDigitsEntered) {
          handleVerifyOTP(newOtp);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
    
    const lastFilledIndex = Math.min(pastedData.length, 6) - 1;
    inputRefs.current[lastFilledIndex]?.focus();
  };

  

  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl">Check your email</h2>
        <p className="text-muted-foreground">
          We've sent a verification code to<br />
          <span className="text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={setInputRef(index)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center border-2 rounded-lg transition-colors ${
                error ? 'border-red-500' : 'border-border focus:border-primary'
              } bg-white outline-none`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleVerifyClick}
          className="w-full h-11 bg-primary hover:bg-primary/90"
          disabled={otp.join('').length !== 6 || isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="text-center text-sm">
          {canResend ? (
            <button
              onClick={handleResendOTP}
              className="text-primary hover:underline"
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <span className="text-muted-foreground">
              Resend code in {countdown}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
