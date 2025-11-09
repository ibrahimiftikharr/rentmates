import { PrivacySettingsCard } from '../components/PrivacySettingsCard';
import { LanguageSwitcherCard } from '../components/LanguageSwitcherCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

// Settings Page - Updated with Privacy, Notifications, and Language Features
export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="mb-2">Settings & Preferences</h1>
        <p className="text-muted-foreground">
          Customize your account settings and preferences
        </p>
      </div>

      {/* Privacy & Notifications - Returns two cards */}
      <PrivacySettingsCard />

      {/* Language Switcher */}
      <LanguageSwitcherCard />

      {/* Account Actions */}
      <Card className="shadow-lg border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
