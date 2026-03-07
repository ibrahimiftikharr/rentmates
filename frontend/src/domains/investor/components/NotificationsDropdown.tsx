import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, AlertCircle, Info, DollarSign, Clock, X, CheckCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { notificationService, Notification as NotificationType } from "@/shared/services/notificationService";
import { socketService } from "@/shared/services/socketService";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "payment" | "danger";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications();
      
      // Transform backend notifications to match UI structure
      const transformedNotifications: Notification[] = response.notifications
        .slice(0, 10) // Show only the latest 10 in dropdown
        .map((notif: NotificationType) => ({
          id: notif._id,
          title: notif.title,
          message: notif.message,
          time: getTimeAgo(notif.createdAt),
          read: notif.read,
          type: getNotificationType(notif.type),
        }));

      setNotifications(transformedNotifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = () => {
      if (open) {
        console.log('🔔 Dropdown: New notification received, refreshing...');
        fetchNotifications();
      }
    };

    const handleInvestmentUpdate = () => {
      if (open) {
        console.log('🔔 Dropdown: Investment updated, refreshing...');
        fetchNotifications();
      }
    };

    const handleLoanRepayment = () => {
      if (open) {
        console.log('🔔 Dropdown: Loan repayment, refreshing...');
        fetchNotifications();
      }
    };

    socketService.on('new_notification', handleNewNotification);
    socketService.on('investment_value_updated', handleInvestmentUpdate);
    socketService.on('loan_repayment_updated', handleLoanRepayment);

    return () => {
      socketService.off('new_notification', handleNewNotification);
      socketService.off('investment_value_updated', handleInvestmentUpdate);
      socketService.off('loan_repayment_updated', handleLoanRepayment);
    };
  }, [open, fetchNotifications]);

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const getNotificationType = (type: string): 'success' | 'warning' | 'info' | 'payment' | 'danger' => {
    // Success types
    if (['loan_issued_from_pool', 'investor_profit_earned'].includes(type)) {
      return 'success';
    }
    // Payment types
    if (['loan_repayment_received'].includes(type)) {
      return 'payment';
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "danger":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "payment":
        return <TrendingUp className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "danger":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "payment":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Failed to remove notification");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer relative ${
                    !notification.read ? "bg-accent/30" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getBgColor(notification.type)} border flex items-center justify-center`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteNotification(notification.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full text-sm text-primary hover:text-primary"
              onClick={() => {
                setOpen(false);
                toast.info("View all notifications", {
                  description: "Opening notifications center..."
                });
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
