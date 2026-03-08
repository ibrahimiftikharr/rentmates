import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, Loader2, DollarSign, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from '@/shared/utils/toast';
import { notificationService, Notification as NotificationType } from '@/shared/services/notificationService';
import { socketService } from '@/shared/services/socketService';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'danger';
  category: 'loan' | 'repayment' | 'profit' | 'default' | 'general';
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching investor notifications...');
      const response = await notificationService.getNotifications();
      console.log('Received notifications:', response);

      // Transform backend notifications to match UI structure
      const transformedNotifications: Notification[] = response.notifications.map((notif: NotificationType) => ({
        id: notif._id,
        title: notif.title,
        message: notif.message,
        time: getTimeAgo(notif.createdAt),
        read: notif.read,
        type: getNotificationType(notif.type),
        category: getNotificationCategory(notif.type),
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error(error.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time investor notifications
    const handleNewNotification = () => {
      console.log('🔔 New notification event received, refreshing...');
      fetchNotifications();
    };

    const handleInvestmentUpdate = () => {
      console.log('🔔 Investment value updated, refreshing notifications...');
      fetchNotifications();
    };

    const handleLoanRepayment = () => {
      console.log('🔔 Loan repayment updated, refreshing notifications...');
      fetchNotifications();
    };

    const handlePoolUpdate = () => {
      console.log('🔔 Pool share price updated, refreshing notifications...');
      fetchNotifications();
    };

    socketService.on('new_notification', handleNewNotification);
    socketService.on('investment_value_updated', handleInvestmentUpdate);
    socketService.on('loan_repayment_updated', handleLoanRepayment);
    socketService.on('pool_share_price_updated', handlePoolUpdate);

    return () => {
      socketService.off('new_notification', handleNewNotification);
      socketService.off('investment_value_updated', handleInvestmentUpdate);
      socketService.off('loan_repayment_updated', handleLoanRepayment);
      socketService.off('pool_share_price_updated', handlePoolUpdate);
    };
  }, [fetchNotifications]);

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

  const getNotificationType = (type: string): 'success' | 'info' | 'warning' | 'danger' => {
    // Success types
    if (['loan_issued_from_pool', 'loan_repayment_received', 'investor_profit_earned'].includes(type)) {
      return 'success';
    }
    // Danger types
    if (['pool_collateral_liquidated', 'loan_default_in_pool'].includes(type)) {
      return 'danger';
    }
    // Warning types
    if (type.includes('warning') || type.includes('overdue')) {
      return 'warning';
    }
    // Default to info
    return 'info';
  };

  const getNotificationCategory = (type: string): 'loan' | 'repayment' | 'profit' | 'default' | 'general' => {
    if (type === 'loan_issued_from_pool') return 'loan';
    if (['loan_repayment_received', 'investor_profit_earned'].includes(type)) return 'repayment';
    if (type === 'investor_profit_earned') return 'profit';
    if (['pool_collateral_liquidated', 'loan_default_in_pool'].includes(type)) return 'default';
    return 'general';
  };

  const getNotificationIcon = (category: string, type: 'success' | 'info' | 'warning' | 'danger') => {
    const baseClass = 'w-5 h-5';
    const colorClass = 
      type === 'success' ? 'text-green-600' :
      type === 'danger' ? 'text-red-600' :
      type === 'warning' ? 'text-orange-600' :
      'text-blue-600';

    if (category === 'loan') return <DollarSign className={`${baseClass} ${colorClass}`} />;
    if (category === 'profit') return <TrendingUp className={`${baseClass} ${colorClass}`} />;
    if (category === 'default') return <AlertTriangle className={`${baseClass} ${colorClass}`} />;
    if (category === 'repayment') return <Shield className={`${baseClass} ${colorClass}`} />;
    return <Bell className={`${baseClass} ${colorClass}`} />;
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

  const handleClearAll = async () => {
    try {
      // Delete all notifications from backend
      await Promise.all(
        notifications.map(notif => notificationService.deleteNotification(notif.id))
      );
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error: any) {
      toast.error('Failed to clear all notifications');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      
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

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = filterCategory === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.category === filterCategory);

  const categoryCount = {
    all: notifications.length,
    loan: notifications.filter(n => n.category === 'loan').length,
    repayment: notifications.filter(n => n.category === 'repayment').length,
    profit: notifications.filter(n => n.category === 'profit').length,
    default: notifications.filter(n => n.category === 'default').length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2">Investment Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your investment activity and loan performance
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

      {/* Category Filters */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              All <Badge variant="secondary" className="ml-2">{categoryCount.all}</Badge>
            </Button>
            <Button
              variant={filterCategory === 'loan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('loan')}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Loans <Badge variant="secondary" className="ml-2">{categoryCount.loan}</Badge>
            </Button>
            <Button
              variant={filterCategory === 'repayment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('repayment')}
            >
              <Shield className="w-4 h-4 mr-1" />
              Repayments <Badge variant="secondary" className="ml-2">{categoryCount.repayment}</Badge>
            </Button>
            <Button
              variant={filterCategory === 'profit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('profit')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Profits <Badge variant="secondary" className="ml-2">{categoryCount.profit}</Badge>
            </Button>
            <Button
              variant={filterCategory === 'default' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('default')}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Defaults <Badge variant="secondary" className="ml-2">{categoryCount.default}</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </Card>
      ) : filteredNotifications.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {filterCategory === 'all' ? 'All Notifications' : `${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Notifications`}
              {unreadCount > 0 && filterCategory === 'all' && (
                <Badge variant="outline" className="ml-2 bg-primary text-white border-primary">
                  {unreadCount} New
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredNotifications.map((notif) => (
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
                    notif.type === 'danger' ? 'bg-red-100' :
                    notif.type === 'warning' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {getNotificationIcon(notif.category, notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium">{notif.title}</p>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2 mt-1.5"></div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{notif.message}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{notif.time}</p>
                      <Badge variant="outline" className="text-xs">
                        {notif.category}
                      </Badge>
                    </div>
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
              {filterCategory === 'all' 
                ? "You're all caught up! No new notifications." 
                : `No ${filterCategory} notifications at the moment.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings Info */}
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="mb-2">Manage Notification Preferences</h3>
          <p className="text-muted-foreground mb-4">
            Customize which investment notifications you receive and how you're alerted.
          </p>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-white"
            onClick={() => onNavigate('profile')}
          >
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
