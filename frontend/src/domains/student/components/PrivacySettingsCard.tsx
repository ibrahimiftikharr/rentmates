import { Lock, Mail, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export function PrivacySettingsCard() {
  const [settings, setSettings] = useState({
    profileVisibility: true,
    emailNotifications: true,
    rentalBids: false,
    messageNotifications: true,
    showEmail: true,
    showPhone: false,
    inAppNotifications: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Settings updated');
  };

  const privacySettings = [
    {
      id: 'profileVisibility',
      icon: Lock,
      label: 'Profile Visibility',
      description: 'Make your profile visible to other users',
    },
    {
      id: 'showEmail',
      icon: Mail,
      label: 'Show Email Address',
      description: 'Display your email on your public profile',
    },
    {
      id: 'showPhone',
      icon: Lock,
      label: 'Show Phone Number',
      description: 'Display your phone number on your public profile',
    },
  ];

  const notificationSettings = [
    {
      id: 'emailNotifications',
      icon: Mail,
      label: 'Email Notifications',
      description: 'Receive important updates via email',
    },
    {
      id: 'inAppNotifications',
      icon: Bell,
      label: 'In-App Notifications',
      description: 'Get notified within the application',
    },
    {
      id: 'rentalBids',
      icon: Bell,
      label: 'Rental Bids Updates',
      description: 'Alerts for new rental bids and offers',
    },
    {
      id: 'messageNotifications',
      icon: Bell,
      label: 'Message Notifications',
      description: 'Alerts when you receive new messages',
    },
  ];

  return (
    <>
      {/* Privacy Settings Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control who can see your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {privacySettings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <setting.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={setting.id} className="cursor-pointer">
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch
                id={setting.id}
                checked={settings[setting.id as keyof typeof settings]}
                onCheckedChange={() => handleToggle(setting.id as keyof typeof settings)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {notificationSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <setting.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={setting.id} className="cursor-pointer">
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch
                id={setting.id}
                checked={settings[setting.id as keyof typeof settings]}
                onCheckedChange={() => handleToggle(setting.id as keyof typeof settings)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
