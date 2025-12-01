import { Heart, CalendarCheck, UserPlus, Home, Search, Wallet, MessageSquare, FileSignature, Bell, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { payRent } from '@/shared/services/walletService';
import { studentDashboardService, DashboardMetrics, Activity, LatestNotification } from '@/domains/student/services/studentDashboardService';
import { socketService } from '@/shared/services/socketService';
import { authService } from '@/domains/auth/services/authService';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [showPayRentDialog, setShowPayRentDialog] = useState(false);
  const [isPayingRent, setIsPayingRent] = useState(false);
  const [landlordId] = useState('673abc123def456789012345'); // Temporary hardcoded landlord ID for testing
  
  // State for dynamic data
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    wishlistedProperties: 0,
    visitRequests: 0,
    joinRequests: 0,
    approvedRentalRequests: 0,
    activeContracts: 0,
    unreadNotifications: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [latestNotifications, setLatestNotifications] = useState<LatestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [metricsData, activitiesData, notificationsData] = await Promise.all([
        studentDashboardService.getDashboardMetrics(),
        studentDashboardService.getRecentActivity(6),
        studentDashboardService.getLatestNotifications(3)
      ]);

      setMetrics(metricsData);
      setActivities(activitiesData);
      setLatestNotifications(notificationsData.notifications);

      // Get user name from auth service
      const user = authService.getCurrentUser();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]); // First name only
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time updates via Socket.IO
    socketService.on('metrics_updated', (data: any) => {
      console.log('Dashboard metrics updated:', data);
      fetchDashboardData(); // Refresh all data when metrics change
    });

    socketService.on('new_activity', (data: any) => {
      console.log('New activity:', data);
      fetchDashboardData(); // Refresh all data when new activity occurs
    });

    socketService.on('new_notification', (data: any) => {
      console.log('New notification received:', data);
      fetchDashboardData(); // Refresh to get updated notification count
    });

    return () => {
      socketService.off('metrics_updated');
      socketService.off('new_activity');
      socketService.off('new_notification');
    };
  }, []);
  
  const stats = [
    { 
      title: 'Wishlisted Properties', 
      value: metrics.wishlistedProperties.toString(), 
      icon: Heart, 
      color: 'text-red-600', 
      bg: 'bg-red-100' 
    },
    { 
      title: 'Visit Requests', 
      value: metrics.visitRequests.toString(), 
      icon: CalendarCheck, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      title: 'Join Requests', 
      value: metrics.joinRequests.toString(), 
      icon: UserPlus, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      title: 'Active Contracts', 
      value: metrics.activeContracts.toString(), 
      icon: FileSignature, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100' 
    },
  ];

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const handlePayRent = async () => {
    setIsPayingRent(true);
    try {
      const result = await payRent(landlordId, 2); // 2 USDT hardcoded rent amount
      toast.success(result.message || 'Rent paid successfully!');
      setShowPayRentDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to pay rent');
    } finally {
      setIsPayingRent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 md:p-8">
        <h1 className="mb-2">Welcome back, {userName}! 👋</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Here's what's happening with your account today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <h2>{loading ? '...' : stat.value}</h2>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notifications Alert Card */}
      <Card 
        className="shadow-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer group"
        onClick={() => onNavigate('notifications')}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Bell className="w-8 h-8 text-white animate-pulse" />
              </div>
              {metrics.unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-white text-xs font-bold">{metrics.unreadNotifications}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="mb-1 group-hover:text-primary transition-colors">
                You have {metrics.unreadNotifications} new notification{metrics.unreadNotifications !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground">Click to view all your notifications and updates</p>
            </div>
            <div className="hidden sm:block">
              <div className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium group-hover:bg-primary group-hover:text-white transition-all">
                View All
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Notifications Preview Card */}
      {latestNotifications.length > 0 && (
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Latest Notifications</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('notifications')}
                className="text-primary hover:text-primary/80"
              >
                See All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestNotifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-3 rounded-lg border ${
                    notification.read ? 'bg-muted/30 border-border' : 'bg-primary/5 border-primary/30'
                  } hover:bg-muted/50 transition-colors cursor-pointer`}
                  onClick={() => onNavigate('notifications')}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.read ? 'bg-gray-400' : 'bg-primary'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${notification.read ? '' : 'text-primary'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm mt-1">Start exploring properties to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.status === 'success' || activity.status === 'completed' 
                          ? 'bg-green-500' 
                          : activity.status === 'pending' 
                            ? 'bg-orange-500' 
                            : 'bg-red-500'
                      }`}></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{getRelativeTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onNavigate('search')}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium">Search Properties</p>
                <p className="text-sm text-muted-foreground">Find your home</p>
              </button>
              <button 
                onClick={() => onNavigate('wishlist')}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium">My Wishlist</p>
                <p className="text-sm text-muted-foreground">Saved properties</p>
              </button>
              <button 
                onClick={() => setShowPayRentDialog(true)}
                className="p-4 rounded-lg border border-border hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-medium">Pay Rent</p>
                <p className="text-sm text-muted-foreground">2 USDT</p>
              </button>
              <button 
                onClick={() => onNavigate('wallet')}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium">Manage Wallet</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Rent Dialog */}
      <Dialog open={showPayRentDialog} onOpenChange={setShowPayRentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Rent</DialogTitle>
            <DialogDescription>
              Pay your monthly rent of 2 USDT to your landlord
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rent Amount:</span>
                  <span className="text-lg font-bold">2.00 USDT</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Transaction Fee:</span>
                  <span className="text-sm font-medium">Gas fees apply</span>
                </div>
              </div>
            </Card>
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              <p>✓ This will deduct 2 USDT from your RentMates balance</p>
              <p>✓ Your landlord will receive the payment instantly</p>
              <p>✓ Transaction is recorded on the blockchain</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPayRentDialog(false)}
              disabled={isPayingRent}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayRent}
              disabled={isPayingRent}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPayingRent ? 'Processing...' : 'Pay 2 USDT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3D Illustration Section */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-4 overflow-hidden">
        <div className="max-w-md">
          <h2 className="mb-2 text-lg sm:text-xl md:text-2xl">Find Your Perfect Student Home</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse hundreds of verified properties, schedule visits, and sign rental contracts seamlessly with blockchain technology.
          </p>
        </div>
        <div className="hidden lg:block flex-shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1634896941598-b6b500a502a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzRCUyMHN0dWRlbnQlMjBjaGFyYWN0ZXIlMjBpbGx1c3RyYXRpb258ZW58MXx8fHwxNzYwMTA0ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="3D Student Illustration"
            className="w-64 h-64 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
