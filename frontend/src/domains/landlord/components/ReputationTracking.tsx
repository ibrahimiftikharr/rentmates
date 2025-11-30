import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Check, X, Award, Mail } from 'lucide-react';
import { Progress } from '@/shared/ui/progress';
import { useEffect, useState } from 'react';
import { landlordService } from '../services/landlordService';
import { socketService } from '@/shared/services/socketService';
import { toast } from 'sonner';

interface ReputationItem {
  id: string;
  label: string;
  completed: boolean;
  points: number;
}

export function ReputationTracking() {
  const [reputationScore, setReputationScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReputationItem[]>([
    {
      id: 'email',
      label: 'Email Verified',
      completed: true, // Always true as email verification is required at signup
      points: 20,
    },
    {
      id: 'profile',
      label: 'Profile Completed',
      completed: false,
      points: 30,
    },
    {
      id: 'id-upload',
      label: 'Government ID Uploaded',
      completed: false,
      points: 25,
    },
    {
      id: 'wallet',
      label: 'Wallet Connected',
      completed: false,
      points: 25,
    },
  ]);

  useEffect(() => {
    fetchReputationData();

    // Listen for real-time reputation updates
    socketService.on('reputation_updated', (data: any) => {
      console.log('Reputation updated via Socket.IO:', data);
      if (data.reputationScore !== undefined) {
        setReputationScore(data.reputationScore);
        updateItemsFromScore(data.reputationScore);
        toast.success('Reputation score updated!', {
          description: `Your new score is ${data.reputationScore} points`
        });
      }
    });

    return () => {
      socketService.off('reputation_updated');
    };
  }, []);

  const fetchReputationData = async () => {
    try {
      setLoading(true);
      const profile = await landlordService.getProfile();
      setReputationScore(profile.reputationScore || 0);
      
      // Get user data to check wallet connection
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const walletConnected = !!(user?.walletAddress);
      
      // Update items based on profile data
      setItems(prevItems => prevItems.map(item => {
        if (item.id === 'email') {
          return { ...item, completed: true }; // Always true
        }
        if (item.id === 'profile') {
          // Profile is complete if phone, nationality, address, profileImage are filled
          const isComplete = !!(profile.phone && profile.nationality && profile.address && profile.profileImage);
          return { ...item, completed: isComplete };
        }
        if (item.id === 'id-upload') {
          // Gov ID is complete if both governmentId number and document are uploaded
          const isComplete = !!(profile.governmentId && profile.govIdDocument);
          return { ...item, completed: isComplete };
        }
        if (item.id === 'wallet') {
          // Check if wallet is connected from user data
          return { ...item, completed: walletConnected };
        }
        return item;
      }));
    } catch (error: any) {
      console.error('Error fetching reputation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemsFromScore = (score: number) => {
    // Get wallet status from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const walletConnected = !!(user?.walletAddress);
    
    // Update items based on score
    // Email: 20, Profile: 30, Gov ID: 25, Wallet: 25
    setItems(prevItems => prevItems.map(item => {
      if (item.id === 'email') return { ...item, completed: true };
      if (item.id === 'profile') return { ...item, completed: score >= 50 }; // 20 + 30
      if (item.id === 'id-upload') return { ...item, completed: score >= 75 }; // 20 + 30 + 25
      if (item.id === 'wallet') return { ...item, completed: walletConnected || score === 100 };
      return item;
    }));
  };

  const totalScore = reputationScore;
  const maxScore = 100;
  const progressPercentage = (totalScore / maxScore) * 100;

  return (
    <Card className="border-0 shadow-lg rounded-xl sm:rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C57FF]" />
          <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Reputation Tracking</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Complete actions to boost your reputation score
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-[#8C57FF]">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Reputation Items */}
        <div className="space-y-2 sm:space-y-3 pt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                item.completed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full flex-shrink-0 ${
                    item.completed
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {item.completed ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  ) : (
                    <X className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm truncate ${
                    item.completed
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm flex-shrink-0 ml-2 ${
                  item.completed
                    ? 'text-green-700'
                    : 'text-gray-500'
                }`}
              >
                {item.completed ? `+${item.points}` : `+0`} pts
              </span>
            </div>
          ))}
        </div>

        {/* Total Score */}
        <div className="pt-3 border-t border-dashed">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-br from-[#8C57FF]/10 to-[#B794F6]/10 rounded-lg">
            <span className="text-[#4A4A68] text-sm sm:text-base">Total Reputation Score</span>
            <span className="text-[#8C57FF] text-lg sm:text-xl">
              {totalScore} pts
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center px-2">
            {totalScore === maxScore
              ? '🎉 All tasks completed! Your reputation is at maximum.'
              : `Complete remaining tasks to earn ${maxScore - totalScore} more points.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
