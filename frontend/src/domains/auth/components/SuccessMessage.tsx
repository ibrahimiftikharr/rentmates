import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { motion } from 'motion/react';
import { authService } from '../services/authService';

interface SuccessMessageProps {
  onContinue: () => void;
}

export function SuccessMessage({ onContinue }: SuccessMessageProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    const user = authService.getCurrentUser();
    if (user) {
      navigate(user.role === 'student' ? '/student' : '/landlord', { replace: true });
    } else {
      onContinue();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100"
      >
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl">Success!</h2>
        <p className="text-muted-foreground text-lg">
          Your account has been created successfully
        </p>
      </div>

      <div className="pt-4">
        <Button
          onClick={handleContinue}
          className="w-full h-11 bg-primary hover:bg-primary/90"
        >
          Continue to Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
