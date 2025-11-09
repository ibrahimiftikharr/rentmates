import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
}

export function OTPModal({ open, onClose }: OTPModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = () => {
    // Mock OTP sending
    setOtpSent(true);
  };

  const handleResetPassword = () => {
    // Mock password reset
    console.log('Password reset for:', email, 'with OTP:', otp);
    onClose();
    setEmail('');
    setOtp('');
    setOtpSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your registered email to receive an OTP
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input-background border border-border"
            />
          </div>
          {!otpSent ? (
            <Button
              onClick={handleSendOTP}
              className="w-full bg-[#8C57FF] hover:bg-[#7B46EE]"
              disabled={!email}
            >
              Send OTP
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-input-background border border-border"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleResetPassword}
                className="w-full bg-[#8C57FF] hover:bg-[#7B46EE]"
                disabled={!otp || otp.length !== 6}
              >
                Reset Password
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
