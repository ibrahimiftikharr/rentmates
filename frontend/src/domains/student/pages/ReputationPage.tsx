import { ReputationCard } from '../components/ReputationCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendingUp, Star } from 'lucide-react';

export function ReputationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="mb-2">Reputation Dashboard</h1>
        <p className="text-muted-foreground">
          Track and improve your reputation score
        </p>
      </div>

      {/* Reputation Score Card */}
      <ReputationCard />

      {/* Score History */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: 'Oct 10, 2025', change: '+5', reason: 'Profile completed', score: 78 },
              { date: 'Oct 8, 2025', change: '+10', reason: 'Document verified', score: 73 },
              { date: 'Oct 5, 2025', change: '+3', reason: 'Email confirmed', score: 63 },
              { date: 'Oct 1, 2025', change: '+8', reason: 'First rental review', score: 60 },
            ].map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">{entry.date}</div>
                  </div>
                  <div>
                    <p className="font-medium">{entry.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm px-2 py-0.5 rounded bg-green-100 text-green-700">
                        {entry.change} points
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary">{entry.score}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { from: 'John Doe', rating: 5, comment: 'Excellent tenant, very reliable!', date: '2 days ago' },
              { from: 'Sarah Smith', rating: 5, comment: 'Great communication and respectful.', date: '1 week ago' },
            ].map((review, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{review.from}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
                <p className="text-sm text-muted-foreground mt-2">{review.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
