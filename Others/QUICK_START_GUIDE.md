# Visit Request System - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Start the Backend
```bash
cd backend
npm start
```
**Expected Output:**
```
Server is running on port 5000
Connected to MongoDB
Socket.IO is ready
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 3. Test the Flow

#### As a Student:
1. Login with student credentials
2. Navigate to **Search Properties**
3. Click **View Details** on any property
4. Click **Schedule Visit** button
5. Fill the form:
   - Select **Virtual** or **In-Person**
   - Pick a date (today or future)
   - Choose a time slot
6. Click **Schedule Visit**
7. ✅ You should see: **"Virtual/In-person visit request sent to landlord successfully!"**
8. Navigate to **Visit Requests** page
9. Your request should appear under **Pending Confirmation**

#### As a Landlord:
1. Login with landlord credentials (in incognito/different browser)
2. 🔔 You should see: **"New visit request received!"** toast
3. Navigate to **Visit Requests** page
4. The new request should appear in real-time
5. Click **Confirm** button:
   - For **Virtual Visit**: Enter Google Meet link (e.g., `https://meet.google.com/abc-defg-hij`)
   - For **Physical Visit**: Direct confirmation
6. ✅ You should see: **"Visit confirmed successfully!"**

#### Back to Student:
1. Switch back to student browser
2. 🔔 You should see: **"Your visit request has been confirmed!"** toast
3. The visit should automatically move from **Pending** to **Upcoming Visits**
4. For virtual visits, a **"Join Meeting"** button appears with the Meet link

## ✨ Features to Test

### Student Features:
- ✅ Schedule virtual visits
- ✅ Schedule in-person visits
- ✅ View pending requests with status
- ✅ View upcoming confirmed visits
- ✅ Access Google Meet link for virtual visits
- ✅ See rescheduled dates with landlord notes
- ✅ View rejection reasons
- ✅ Real-time toast notifications

### Landlord Features:
- ✅ View all visit requests for properties
- ✅ Confirm visits (with Meet link for virtual)
- ✅ Reschedule visits with new date/time + notes
- ✅ Reject visits with reason
- ✅ Real-time notifications when requests arrive
- ✅ Separate tabs for Physical vs Virtual visits
- ✅ Copy Meet link to clipboard

## 🎯 Testing Scenarios

### Scenario 1: Virtual Visit Request
1. **Student:** Schedule virtual visit for tomorrow at 2 PM
2. **Landlord:** Receive notification immediately
3. **Landlord:** Confirm and add Meet link: `https://meet.google.com/test-link`
4. **Student:** See confirmation toast
5. **Student:** Visit moves to Upcoming with "Join Meeting" button
6. **Student:** Click button → Opens Meet link in new tab

### Scenario 2: In-Person Visit Request
1. **Student:** Schedule in-person visit for next week
2. **Landlord:** Receive notification
3. **Landlord:** Confirm visit
4. **Student:** See confirmation
5. **Student:** Visit shows property address as meeting location

### Scenario 3: Reschedule
1. **Student:** Schedule visit for Monday at 10 AM
2. **Landlord:** Click "Reschedule"
3. **Landlord:** Change to Tuesday at 3 PM
4. **Landlord:** Add note: "Original time not available, hope Tuesday works!"
5. **Student:** See reschedule notification with new time and note
6. **Student:** Visit shows rescheduled date with amber color

### Scenario 4: Rejection
1. **Student:** Schedule visit for property
2. **Landlord:** Click "Disapprove"
3. **Landlord:** Enter reason: "Property already rented"
4. **Student:** See rejection toast with reason
5. **Student:** Visit moves to Past Visits with red status

## 🔍 What to Look For

### Console Logs (Backend):
```
User connected: <socket-id>
User joined room: student_<user-id>
Visit request created for property: <property-id>
Notification sent to: landlord_<landlord-id>
```

### Console Logs (Frontend):
```
Socket.IO connected
Joined room: student_<user-id>
Visit request created successfully
```

### Toast Notifications:
- Student sees success when creating request
- Landlord sees info toast when request arrives
- Student sees success when visit confirmed
- Student sees info toast when visit rescheduled
- Student sees error toast when visit rejected

## 🐛 Troubleshooting

### "Failed to create visit request"
- ✅ Check backend is running on port 5000
- ✅ Check MongoDB connection
- ✅ Verify you're logged in as student
- ✅ Check browser console for errors

### "No real-time notifications"
- ✅ Check Socket.IO connection (console log: "Socket.IO connected")
- ✅ Verify room join (console: "User joined room: ...")
- ✅ Check backend Socket.IO logs
- ✅ Try refreshing both student and landlord pages

### "Visit doesn't appear on landlord side"
- ✅ Verify property belongs to logged-in landlord
- ✅ Check network tab for API call (should return 201)
- ✅ Manually refresh Visit Requests page
- ✅ Check backend logs for errors

### "Meet link button doesn't appear"
- ✅ Verify visit type is "virtual"
- ✅ Check landlord entered Meet link during confirmation
- ✅ Verify visit status is "confirmed"
- ✅ Check meetLink field in visit object

## 📊 API Endpoints Reference

### Visit Requests:
```
POST   /api/visit-requests              - Create request
GET    /api/visit-requests/student      - Get student requests
GET    /api/visit-requests/landlord     - Get landlord requests
PUT    /api/visit-requests/:id/confirm  - Confirm visit
PUT    /api/visit-requests/:id/reschedule - Reschedule
PUT    /api/visit-requests/:id/reject   - Reject
```

### Notifications:
```
GET    /api/notifications               - Get all
GET    /api/notifications/unread-count  - Get count
PUT    /api/notifications/:id/read      - Mark read
PUT    /api/notifications/mark-all-read - Mark all read
```

## 🎨 UI States Reference

### Visit Request Status Colors:
- **Pending:** Yellow badge - "Pending Confirmation"
- **Confirmed:** Green badge - "Confirmed"
- **Rescheduled:** Amber badge - "Rescheduled"
- **Rejected:** Red badge - "Declined"
- **Completed:** Blue badge - "Completed"

### Button States:
- **Confirm Button:** Green with checkmark icon
- **Reschedule Button:** Blue with refresh icon
- **Disapprove Button:** Red with X icon
- **Join Meeting Button:** Blue with video icon + external link

## 💡 Tips for Testing

1. **Use Chrome DevTools:** Monitor Network tab for API calls
2. **Check Console:** Look for Socket.IO connection messages
3. **Use Incognito:** Test student and landlord simultaneously
4. **Clear Cache:** If Socket.IO issues persist
5. **Check MongoDB:** Verify data is being saved correctly

## 📝 Next Steps

After testing core features:
1. Test with multiple properties
2. Test with multiple concurrent requests
3. Test reschedule followed by confirmation
4. Test date/time validation
5. Test with invalid Meet links
6. Test with very old visit dates

## 🎉 Success Criteria

Your implementation is working correctly if:
- ✅ Student can create visit requests
- ✅ Landlord receives instant notifications
- ✅ Visit requests appear on both sides without refresh
- ✅ Confirm/Reschedule/Reject actions work
- ✅ Status updates happen in real-time
- ✅ Meet links work for virtual visits
- ✅ Toast notifications appear correctly
- ✅ No console errors

## 🔗 Related Documentation

- Main Implementation: `VISIT_REQUEST_IMPLEMENTATION.md`
- Backend Models: `backend/models/visitRequestModel.js`
- Frontend Services: `frontend/src/shared/services/visitRequestService.ts`
- Socket.IO Setup: `backend/server.js` (lines 24-55)

---

**Need Help?** Check the browser console and backend terminal for error messages.
