import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 1,
      title: 'Profile Verified', 
      message: 'Your identity has been successfully verified!', 
      time: '5 minutes ago',
      read: false,
      type: 'success'
    },
    { 
      id: 2,
      title: 'New Message', 
      message: 'John Doe sent you a message about the apartment listing', 
      time: '1 hour ago',
      read: false,
      type: 'info'
    },
    { 
      id: 3,
      title: 'Document Uploaded', 
      message: 'Your passport document has been uploaded successfully', 
      time: '2 hours ago',
      read: true,
      type: 'success'
    },
    { 
      id: 4,
      title: 'Reputation Updated', 
      message: 'You earned +5 reputation points for completing your profile', 
      time: '1 day ago',
      read: true,
      type: 'info'
    },
    { 
      id: 5,
      title: 'Verification Pending', 
      message: 'Your visa document is pending verification', 
      time: '2 days ago',
      read: true,
      type: 'warning'
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const handleMarkRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    toast.success('Notification marked as read');
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notification deleted');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your account activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Recent Notifications
              {unreadCount > 0 && (
                <Badge variant="outline" className="ml-2 bg-primary text-white border-primary">
                  {unreadCount} New
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    !notif.read 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'success' ? 'bg-green-100' :
                    notif.type === 'warning' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      notif.type === 'success' ? 'text-green-600' :
                      notif.type === 'warning' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium">{notif.title}</p>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2 mt-1.5"></div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{notif.message}</p>
                    <p className="text-sm text-muted-foreground">{notif.time}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!notif.read && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No Notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! No new notifications.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings Info */}
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="mb-2">Manage Notification Preferences</h3>
          <p className="text-muted-foreground mb-4">
            Customize which notifications you receive in the Settings page.
          </p>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-white"
            onClick={() => onNavigate('settings')}
          >
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
