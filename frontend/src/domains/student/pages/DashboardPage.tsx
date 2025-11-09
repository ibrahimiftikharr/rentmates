import { Heart, CalendarCheck, UserPlus, Home, Search, Wallet, MessageSquare, FileSignature, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const stats = [
    { title: 'Wishlisted Properties', value: '3', icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Visit Requests', value: '4', icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Join Requests', value: '2', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Contracts', value: '1', icon: FileSignature, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 md:p-8">
        <h1 className="mb-2">Welcome back, Jessica! 👋</h1>
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
                  <h2>{stat.value}</h2>
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
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 group-hover:text-primary transition-colors">You have 2 new notifications</h3>
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

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Added property to wishlist', time: '2 hours ago', status: 'success' },
                { action: 'Visit request confirmed', time: '1 day ago', status: 'success' },
                { action: 'Join request pending approval', time: '2 days ago', status: 'pending' },
                { action: 'Wallet connected successfully', time: '3 days ago', status: 'success' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p>{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                onClick={() => onNavigate('visit-requests')}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium">Visit Requests</p>
                <p className="text-sm text-muted-foreground">Schedule visits</p>
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
