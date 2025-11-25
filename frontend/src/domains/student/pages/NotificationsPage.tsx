import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import { notificationService, Notification as NotificationType } from '@/shared/services/notificationService';
import { socketService } from '@/shared/services/socketService';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    socketService.on('new_notification', () => {
      fetchNotifications();
    });

    socketService.on('visit_confirmed', () => {
      fetchNotifications();
    });

    socketService.on('visit_rescheduled', () => {
      fetchNotifications();
    });

    socketService.on('visit_rejected', () => {
      fetchNotifications();
    });

    return () => {
      socketService.off('new_notification');
      socketService.off('visit_confirmed');
      socketService.off('visit_rescheduled');
      socketService.off('visit_rejected');
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching student notifications...');
      const response = await notificationService.getNotifications();
      console.log('Received notifications:', response);

      // Transform backend notifications to match UI structure
      const transformedNotifications: Notification[] = response.notifications.map((notif: NotificationType) => ({
        id: parseInt(notif._id.slice(-6), 16), // Convert last 6 chars of ObjectId to number
        title: notif.title,
        message: notif.message,
        time: getTimeAgo(notif.createdAt),
        read: notif.read,
        type: getNotificationType(notif.type),
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error(error.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  };

  const getNotificationType = (type: string): 'success' | 'info' | 'warning' => {
    if (type === 'visit_confirmed') return 'success';
    if (type === 'visit_rejected') return 'warning';
    return 'info';
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const handleMarkRead = async (id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    try {
      // Convert back to MongoDB ObjectId format (approximate)
      const notifId = notification.id.toString(16).padStart(24, '0');
      await notificationService.markAsRead(notifId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error: any) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notification deleted');
  };

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
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </Card>
      ) : notifications.length > 0 ? (
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
