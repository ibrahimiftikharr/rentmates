# Visit Request Time Slot & Time Zone Implementation Summary

## Overview
Successfully implemented the following requirements for the Student Dashboard Property Details Page visit request feature:

## 1. Time Slot Display for Students ✅

### Changes Made:
- **30-Minute Intervals**: Time slots are now displayed as 30-minute intervals (e.g., "09:00 - 09:30")
- **Local Time Zone Display**: All time slots are automatically converted to and displayed in the student's local time zone
- **Automatic Detection**: User's time zone is automatically detected using JavaScript's `Intl.DateTimeFormat().resolvedOptions().timeZone`

### Implementation Details:
- Created `/frontend/src/shared/utils/timezone.ts` with utility functions for time zone conversion
- Updated `PropertyDetailsPage.tsx` to:
  - Fetch available time slots from the backend when a date is selected
  - Display time slots in 30-minute intervals
  - Show times in the student's local time zone
  - Disable/mark booked time slots

## 2. Time Display for Landlords ✅

### Changes Made:
- **Landlord Time Zone**: Landlords see visit request times in their own local time zone
- **Rescheduling**: When landlords reschedule, the time is based on their local time zone and stored as UTC
- **Student View**: Students see the rescheduled time converted to their own local time zone

### Implementation Details:
- Updated `VisitRequestsPage.tsx` (landlord) to:
  - Auto-detect landlord's time zone
  - Convert stored UTC times to landlord's local time for display
  - Convert landlord's local time to UTC when rescheduling
- Updated `VisitRequestsPage.tsx` (student) to:
  - Show all times in student's local time zone
  - Display 30-minute time intervals

## 3. Slot Availability & Booking Conflicts ✅

### Changes Made:
- **Backend Validation**: Added conflict checking in the backend to prevent double-booking
- **Frontend Display**: Only available time slots are selectable; booked slots are marked as "(Booked)"
- **Real-time Updates**: Available slots are fetched when a date is selected

### Implementation Details:

#### Backend Changes:
1. **Updated Model** (`visitRequestModel.js`):
   - Added `visitTimeEnd` field for 30-minute slot end time
   - Added `studentTimeZone` and `landlordTimeZone` fields
   - Added `rescheduledTimeEnd` field

2. **Updated Controller** (`visitRequestController.js`):
   - Modified `createVisitRequest` to check for conflicting time slots
   - Added `getAvailableTimeSlots` endpoint that:
     - Generates all 30-minute slots from 8:00 to 20:00 UTC
     - Marks booked slots as unavailable
     - Returns available/unavailable status for each slot

3. **Added Route** (`visitRequestRoutes.js`):
   - New endpoint: `GET /api/visit-requests/available-slots?propertyId=XXX&date=YYYY-MM-DD`

#### Frontend Changes:
1. **Service Update** (`visitRequestService.ts`):
   - Added `TimeSlot` interface
   - Updated `createVisitRequest` to accept `visitTimeEnd` and `studentTimeZone`
   - Added `getAvailableTimeSlots` method

2. **Time Zone Utilities** (`timezone.ts`):
   - `getUserTimeZone()`: Detects user's IANA time zone
   - `convertUTCToLocal()`: Converts UTC time to local time
   - `convertLocalToUTC()`: Converts local time to UTC
   - `addMinutesToTime()`: Adds minutes to a time string
   - `formatTimeSlot()`: Formats time slots with time zone info

3. **Component Updates**:
   - **PropertyDetailsPage**: 
     - Fetches available slots when date is selected
     - Displays 30-minute intervals in local time
     - Converts local time to UTC before submitting
   - **VisitRequestsPage (Landlord)**:
     - Converts UTC to landlord's local time for display
     - Converts local time to UTC when rescheduling
   - **VisitRequestsPage (Student)**:
     - Shows all times in student's local time zone

## How It Works

### Time Storage & Conversion Flow:
1. **Student selects time**: 
   - Sees slots in their local time (e.g., 14:00 PST)
   - Frontend converts to UTC (e.g., 22:00 UTC) before sending to backend
   - Backend stores in UTC

2. **Landlord views request**:
   - Backend retrieves UTC time (22:00 UTC)
   - Frontend converts to landlord's local time (e.g., 06:00 JST next day)
   - Landlord sees "06:00 JST"

3. **Landlord reschedules**:
   - Landlord selects new time in their timezone (e.g., 10:00 JST)
   - Frontend converts to UTC (e.g., 01:00 UTC)
   - Backend stores in UTC

4. **Student sees reschedule**:
   - Backend retrieves UTC time (01:00 UTC)
   - Frontend converts to student's local time (e.g., 17:00 PST previous day)
   - Student sees "17:00 PST"

### Conflict Prevention:
- When a student tries to book a time slot, the backend checks for existing bookings at that UTC time
- If a conflict exists (status: pending, confirmed, or rescheduled), the request is rejected with a 409 error
- The frontend fetches available slots and marks booked slots as unavailable in the dropdown

## Testing Recommendations

1. **Time Zone Testing**:
   - Test with users in different time zones
   - Verify times display correctly in each user's local time
   - Verify UTC conversion is accurate

2. **Booking Conflict Testing**:
   - Try booking the same time slot with two different students
   - Verify second booking is rejected
   - Verify booked slots show as unavailable

3. **Reschedule Testing**:
   - Have landlord reschedule a visit
   - Verify student sees the rescheduled time in their local time zone
   - Verify the new time slot doesn't conflict with other bookings

## Files Modified

### Backend:
- `backend/models/visitRequestModel.js`
- `backend/controllers/visitRequestController.js`
- `backend/routes/visitRequestRoutes.js`

### Frontend:
- `frontend/src/shared/services/visitRequestService.ts`
- `frontend/src/shared/utils/timezone.ts` (NEW)
- `frontend/src/domains/student/components/property-details/PropertyDetailsPage.tsx`
- `frontend/src/domains/landlord/pages/VisitRequestsPage.tsx`
- `frontend/src/domains/student/pages/VisitRequestsPage.tsx`

## Notes
- All times are stored in UTC in the database for consistency
- Time zone conversions happen on the frontend for display
- The system uses IANA time zone identifiers (e.g., "America/New_York", "Asia/Tokyo")
- 30-minute slots are generated from 8:00 AM to 8:00 PM UTC (covering most reasonable visiting hours across time zones)
