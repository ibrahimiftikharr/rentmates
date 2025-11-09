import { TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

export function ReputationCard() {
  const reputationScore = 78;
  const maxScore = 100;
  const percentage = (reputationScore / maxScore) * 100;

  // Calculate stroke dash for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const tips = [
    { text: 'Complete your profile', points: '+5', completed: true },
    { text: 'Verify your email', points: '+3', completed: false },
    { text: 'Upload ID/Passport', points: '+10', completed: false },
    { text: 'Link your wallet', points: '+8', completed: false },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Reputation Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress Gauge */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle with gradient */}
              <defs>
                <linearGradient id="reputationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8C57FF" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="url(#reputationGradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-semibold text-primary">{reputationScore}</div>
              <div className="text-muted-foreground">/ {maxScore}</div>
            </div>
          </div>
        </div>

        {/* Progress Tips */}
        <div className="space-y-3">
          <h4 className="font-medium">Ways to improve your score</h4>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  tip.completed ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tip.completed ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                  )}
                  <span className={tip.completed ? 'line-through text-muted-foreground' : ''}>
                    {tip.text}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded ${
                  tip.completed ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                }`}>
                  {tip.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary">12</div>
            <div className="text-sm text-muted-foreground">Tasks Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary">5</div>
            <div className="text-sm text-muted-foreground">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary">98%</div>
            <div className="text-sm text-muted-foreground">Reliability</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
