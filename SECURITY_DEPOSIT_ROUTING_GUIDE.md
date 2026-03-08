# Security Deposit Pages - Routing Integration Guide

## Overview
This guide explains how to integrate the new Security Deposit pages into your application's routing system.

---

## 1. Student Security Deposit Page

### File Location
```
frontend/src/domains/student/pages/SecurityDepositPage.tsx
```

### Route Setup (if not already present)

In your student routes file (e.g., `frontend/src/domains/student/routes.tsx` or similar):

```typescript
import { SecurityDepositPage } from '@/domains/student/pages/SecurityDepositPage';

// Add to your routes array:
{
  path: '/student/security-deposit',
  element: <SecurityDepositPage />
}
```

### Navigation Menu (Student Dashboard)

Add to student sidebar/navigation:

```typescript
{
  name: 'Security Deposit',
  path: '/student/security-deposit',
  icon: <Shield className="w-5 h-5" />
}
```

---

## 2. Landlord Security Deposit Page

### File Location
```
frontend/src/domains/landlord/pages/LandlordSecurityDepositPage.tsx
```

### Route Setup

In your landlord routes file (e.g., `frontend/src/domains/landlord/routes.tsx` or similar):

```typescript
import { LandlordSecurityDepositPage } from '@/domains/landlord/pages/LandlordSecurityDepositPage';

// Add to your routes array:
{
  path: '/landlord/security-deposit',
  element: <LandlordSecurityDepositPage />
}
```

### Navigation Menu (Landlord Dashboard)

Add to landlord sidebar/navigation:

```typescript
{
  name: 'Security Deposits',
  path: '/landlord/security-deposit',
  icon: <Shield className="w-5 h-5" />
}
```

---

## 3. Example Route Configuration

### Using React Router v6

```typescript
// frontend/src/App.tsx or similar router file

import { SecurityDepositPage } from '@/domains/student/pages/SecurityDepositPage';
import { LandlordSecurityDepositPage } from '@/domains/landlord/pages/LandlordSecurityDepositPage';

const router = createBrowserRouter([
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      // ... other student routes
      {
        path: 'security-deposit',
        element: <SecurityDepositPage />
      }
    ]
  },
  {
    path: '/landlord',
    element: <LandlordLayout />,
    children: [
      // ... other landlord routes
      {
        path: 'security-deposit',
        element: <LandlordSecurityDepositPage />
      }
    ]
  }
]);
```

---

## 4. Sidebar/Navigation Component Updates

### Student Sidebar Example

```typescript
// frontend/src/domains/student/components/Sidebar.tsx

import { Shield } from 'lucide-react';

const studentMenuItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: Home },
  { name: 'Properties', path: '/student/properties', icon: Building },
  { name: 'Security Deposit', path: '/student/security-deposit', icon: Shield }, // NEW
  { name: 'Wallet', path: '/student/wallet', icon: Wallet },
  { name: 'Messages', path: '/student/messages', icon: MessageSquare }
];
```

### Landlord Sidebar Example

```typescript
// frontend/src/domains/landlord/components/Sidebar.tsx

import { Shield } from 'lucide-react';

const landlordMenuItems = [
  { name: 'Dashboard', path: '/landlord/dashboard', icon: Home },
  { name: 'Properties', path: '/landlord/properties', icon: Building },
  { name: 'Tenants', path: '/landlord/tenants', icon: Users },
  { name: 'Security Deposits', path: '/landlord/security-deposit', icon: Shield }, // NEW
  { name: 'Messages', path: '/landlord/messages', icon: MessageSquare }
];
```

---

## 5. Breadcrumb Updates

If your app uses breadcrumbs, add mappings:

```typescript
const breadcrumbMap = {
  // Student
  '/student/security-deposit': ['Home', 'Security Deposit'],
  
  // Landlord
  '/landlord/security-deposit': ['Home', 'Security Deposits']
};
```

---

## 6. Protected Route Configuration

Ensure the routes are protected and accessible only to authenticated users:

```typescript
// Example with route protection

const ProtectedRoute = ({ children, role }) => {
  const user = useAuth();
  
  if (!user || user.role !== role) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// In routes:
{
  path: '/student/security-deposit',
  element: (
    <ProtectedRoute role="student">
      <SecurityDepositPage />
    </ProtectedRoute>
  )
}
```

---

## 7. Direct Access URLs

After integration, the pages will be accessible at:

- **Student:** `http://localhost:5173/student/security-deposit`
- **Landlord:** `http://localhost:5173/landlord/security-deposit`

---

## 8. Alternative: Modal/Dialog Integration

If you prefer to integrate the security deposit functionality as a modal rather than a separate page:

### For Student
```typescript
// In student dashboard or relevant component
import { SecurityDepositDialog } from '@/domains/student/components/SecurityDepositDialog';

<Button onClick={() => setShowDepositDialog(true)}>
  <Shield className="w-4 h-4 mr-2" />
  Manage Security Deposit
</Button>

<SecurityDepositDialog 
  open={showDepositDialog} 
  onOpenChange={setShowDepositDialog} 
/>
```

### For Landlord
```typescript
// In landlord tenants page or dashboard
import { RefundDepositDialog } from '@/domains/landlord/components/RefundDepositDialog';

<Button onClick={() => setShowRefundDialog(true)}>
  Refund Deposit
</Button>

<RefundDepositDialog
  rental={selectedRental}
  open={showRefundDialog}
  onOpenChange={setShowRefundDialog}
  onSuccess={handleRefundSuccess}
/>
```

---

## 9. Quick Access Links

### Add Quick Access Button on Dashboard

**Student Dashboard:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Security Deposit</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground mb-4">
      Manage your rental security deposit
    </p>
    <Button asChild className="w-full">
      <Link to="/student/security-deposit">
        <Shield className="w-4 h-4 mr-2" />
        View Security Deposit
      </Link>
    </Button>
  </CardContent>
</Card>
```

**Landlord Dashboard:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Security Deposits</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground mb-4">
      Manage tenant security deposits
    </p>
    <Button asChild className="w-full">
      <Link to="/landlord/security-deposit">
        <Shield className="w-4 h-4 mr-2" />
        Manage Deposits
      </Link>
    </Button>
  </CardContent>
</Card>
```

---

## 10. Notification Badge Integration

Add notification badges to show pending actions:

```typescript
// In student sidebar
{
  name: 'Security Deposit',
  path: '/student/security-deposit',
  icon: Shield,
  badge: depositStatus === 'pending' ? 'Action Required' : null
}

// In landlord sidebar
{
  name: 'Security Deposits',
  path: '/landlord/security-deposit',
  icon: Shield,
  badge: pendingDepositsCount > 0 ? pendingDepositsCount : null
}
```

---

## 11. Verification Checklist

After integration, verify:

- [ ] Student can navigate to Security Deposit page from sidebar
- [ ] Landlord can navigate to Security Deposits page from sidebar
- [ ] Direct URL access works for both pages
- [ ] Pages are only accessible to authenticated users with correct role
- [ ] Navigation highlights active route
- [ ] Back navigation works correctly
- [ ] Mobile navigation works (hamburger menu)
- [ ] Breadcrumbs display correctly (if applicable)
- [ ] Page titles are correct in browser tab

---

## 12. Example Complete Navigation Setup

Here's a complete example of how it might look:

```typescript
// frontend/src/domains/student/Layout.tsx

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Shield, Wallet, MessageSquare, User } from 'lucide-react';

export function StudentLayout() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Browse Properties', path: '/student/properties', icon: Building },
    { name: 'My Rentals', path: '/student/rentals', icon: FileText },
    { name: 'Security Deposit', path: '/student/security-deposit', icon: Shield },
    { name: 'Wallet', path: '/student/wallet', icon: Wallet },
    { name: 'Messages', path: '/student/messages', icon: MessageSquare },
    { name: 'Profile', path: '/student/profile', icon: User }
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold">RentMates</h2>
        </div>
        <nav className="mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 ${
                  isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Summary

1. Import the pages in your routing configuration
2. Add route definitions for both student and landlord
3. Update navigation menus with new menu items
4. Add the Shield icon from lucide-react
5. Protect routes with authentication
6. Test navigation and direct access
7. Add quick access links on dashboards (optional)
8. Add notification badges (optional)

That's it! The Security Deposit pages are now integrated into your application. 🎉
