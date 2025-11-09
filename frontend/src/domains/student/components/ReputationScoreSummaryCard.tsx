import { Award, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

export function ReputationScoreSummaryCard() {
  const score = 78;
  const maxScore = 100;
  const percentage = (score / maxScore) * 100;
  
  // Determine trust level based on score
  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score >= 75) return { level: 'High', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (score >= 50) return { level: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { level: 'Low', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const trustLevel = getTrustLevel(score);

  // Calculate stroke dash for circular progress
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Circular Progress */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
            <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="10"
                fill="none"
                className="sm:hidden"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="10"
                fill="none"
                className="hidden sm:block"
              />
              {/* Progress circle */}
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8C57FF" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle
                cx="56"
                cy="56"
                r={radius}
                stroke="url(#scoreGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out sm:hidden"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="url(#scoreGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="hidden sm:block transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-semibold text-primary">{score}</div>
              <div className="text-xs text-muted-foreground">/ {maxScore}</div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3 sm:space-y-4 w-full">
            <div>
              <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h3 className="font-medium text-sm sm:text-base">Reputation Score</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Your trust level is <span className={`font-medium ${trustLevel.color}`}>{trustLevel.level}</span>
              </p>
            </div>

            {/* Trust Level Badge */}
            <div className="flex justify-center sm:justify-start">
              <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${trustLevel.bgColor}`}>
                <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${trustLevel.color}`} />
                <span className={`text-xs sm:text-sm font-medium ${trustLevel.color}`}>
                  {trustLevel.level} Trust Level
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-sm sm:text-base font-medium text-primary">12</div>
                <div className="text-xs text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-sm sm:text-base font-medium text-primary">5</div>
                <div className="text-xs text-muted-foreground">Documents Uploaded</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-sm sm:text-base font-medium text-primary">98%</div>
                <div className="text-xs text-muted-foreground">Reliable</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
