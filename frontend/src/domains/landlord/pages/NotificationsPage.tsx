import { Bell, Check, X, User, Calendar, DollarSign, FileText, Home, AlertCircle } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'visit-request' | 'join-request' | 'payment' | 'contract' | 'maintenance' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'join-request',
    title: 'New Join Request',
    message: 'Jane Doe has submitted a rental request for Modern 2-Bed Flat in City Centre',
    timestamp: '2 hours ago',
    read: false,
    actionable: true,
  },
  {
    id: '2',
    type: 'visit-request',
    title: 'Visit Request Scheduled',
    message: 'John Smith has scheduled a property visit for tomorrow at 2:00 PM',
    timestamp: '5 hours ago',
    read: false,
    actionable: true,
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: 'Rent payment of £1,200 received from Sarah Johnson',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'contract',
    title: 'Contract Signed',
    message: 'Michael Chen has signed the rental agreement for Cosy Studio Near University',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'maintenance',
    title: 'Maintenance Request',
    message: 'Emma Wilson reported a plumbing issue at Spacious 3-Bed House with Garden',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'System Update',
    message: 'New blockchain verification features are now available',
    timestamp: '1 week ago',
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'visit-request':
      return <Calendar className="h-5 w-5 text-blue-600" />;
    case 'join-request':
      return <User className="h-5 w-5 text-purple-600" />;
    case 'payment':
      return <DollarSign className="h-5 w-5 text-green-600" />;
    case 'contract':
      return <FileText className="h-5 w-5 text-orange-600" />;
    case 'maintenance':
      return <Home className="h-5 w-5 text-red-600" />;
    case 'system':
      return <AlertCircle className="h-5 w-5 text-gray-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'visit-request':
      return 'bg-blue-500/10 border-blue-200';
    case 'join-request':
      return 'bg-purple-500/10 border-purple-200';
    case 'payment':
      return 'bg-green-500/10 border-green-200';
    case 'contract':
      return 'bg-orange-500/10 border-orange-200';
    case 'maintenance':
      return 'bg-red-500/10 border-red-200';
    case 'system':
      return 'bg-gray-500/10 border-gray-200';
    default:
      return 'bg-gray-500/10 border-gray-200';
  }
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">Notifications</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            className="text-[#8C57FF] hover:text-[#7645E8] border-[#8C57FF]/20"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center shadow-lg">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`shadow-md hover:shadow-lg transition-shadow ${
                !notification.read ? 'border-l-4 border-l-[#8C57FF]' : ''
              }`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`text-sm sm:text-base ${!notification.read ? 'text-[#4A4A68]' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-[#8C57FF] rounded-full mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="text-[#8C57FF] hover:text-[#7645E8] h-7 text-xs"
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700 h-7 px-2"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
