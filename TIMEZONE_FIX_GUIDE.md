# Timezone Conversion Fix - Troubleshooting Guide

## What Was Wrong

The original `convertLocalToUTC` function had an overly complex and buggy implementation that incorrectly calculated timezone offsets, leading to wrong time conversions.

## What Was Fixed

Simplified the timezone conversion logic to use a reliable method:

1. **convertLocalToUTC**: Create a test date at 12:00 UTC, format it in both UTC and the source timezone, calculate the offset from the difference, then apply to the target time
2. **convertUTCToLocal**: Create a proper UTC Date object with the time, then format it in the target timezone (this was already working correctly)

## How It Works Now

### Example: Student in Pakistan (Karachi) selects 13:00

1. **Student selects**: 13:00 in Asia/Karachi timezone
2. **Conversion to UTC**: 
   - Karachi is UTC+5
   - 13:00 Karachi = 08:00 UTC
   - This is stored in the database
3. **Landlord views** (also in Karachi):
   - Retrieves: 08:00 UTC
   - Converts to Asia/Karachi: 13:00
   - **Result**: Landlord sees 13:00 ✅

### The Math:
- Test date: March 11, 2026 at 12:00 UTC
- In Karachi: 12:00 UTC = 17:00 Karachi
- Offset: 17 - 12 = +5 hours
- Conversion: 13:00 Karachi - 5 hours = 08:00 UTC ✅

## How to Verify the Fix

### 1. Check Browser Console

Open your browser's Developer Tools Console, and you'll see debug logs like:

```
🔄 convertLocalToUTC: {input: "13:00", sourceTimeZone: "Asia/Karachi", date: "2026-3-11"}
  Test date (12:00 UTC): {inUTC: "12:00", inSourceTZ: "17:00"}
  Calculated offset: UTC+5
  Result: 13:00 (Asia/Karachi) → 08:00 (UTC)
```

Then when the landlord views:

```
🔄 convertUTCToLocal: {inputUTC: "08:00", targetTimeZone: "Asia/Karachi", date: "2026-03-11"}
  Result: 08:00 (UTC) → 13:00 (Asia/Karachi)
```

### 2. Manual Test Steps

1. **Student Action**:
   - Go to a property details page
   - Click "Make a Visit Request"
   - Select March 11, 2026
   - Select a time (e.g., 13:00)
   - Your timezone should show as "(Asia/Karachi)" or "(Karachi)"
   - Click "Schedule Visit"

2. **Check Console**:
   - Look for the timezone conversion logs
   - Verify the UTC time is calculated correctly (13:00 Karachi → 08:00 UTC)

3. **Landlord View**:
   - Switch to landlord account (or use different browser)
   - Go to Visit Requests page
   - Find the visit request you just created
   - **The time should match what you selected** (13:00 - 13:30)
   - Check console for the reverse conversion logs

### 3. Test with Different Timezones

To thoroughly test, you can simulate different timezones:

1. Open Chrome DevTools
2. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
3. Type "sensors" and select "Show Sensors"
4. At the bottom, there's a "Location" dropdown
5. At the bottom of that dropdown, click "Manage"
6. You can add custom locations with different timezones

Or use the Console:

```javascript
// Check your current timezone
Intl.DateTimeFormat().resolvedOptions().timeZone

// This will show "Asia/Karachi" if you're in Pakistan
```

## Common Timezone Reference

- **Pakistan (Karachi)**: UTC+5
- **United Kingdom (London)**: UTC+0 (or UTC+1 during DST)
- **USA (New York)**: UTC-5 (EST) or UTC-4 (EDT)  
- **Japan (Tokyo)**: UTC+9
- **Australia (Sydney)**: UTC+10 (or UTC+11 during DST)

## If Times Still Don't Match

1. **Check the console logs**:
   - Look for the 🔄 emoji logs
   - Verify the timezone detection is correct
   - Verify the offset calculation is correct
   - Verify the final conversion is correct

2. **Check the backend**:
   - The backend stores times in UTC
   - Use MongoDB Compass or query the database
   - Look at the `visitTime` field - it should be in UTC

3. **Clear browser cache**:
   - The old JavaScript files might still be cached
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. **Check the date**:
   - Make sure both student and landlord are looking at the same date
   - DST (Daylight Saving Time) transitions can affect offsets

## Example Database Entry

If a student in Karachi selects "13:00 - 13:30" on March 11, 2026, the database should contain:

```json
{
  "visitDate": "2026-03-11T00:00:00.000Z",
  "visitTime": "08:00",
  "visitTimeEnd": "08:30",
  "studentTimeZone": "Asia/Karachi",
  "status": "pending"
}
```

And when displayed:
- Student in Karachi sees: **13:00 - 13:30**
- Landlord in Karachi sees: **13:00 - 13:30**
- Landlord in London sees: **08:00 - 08:30**
- Landlord in New York sees: **03:00 - 03:30**

All viewing the **same** UTC time, just in their local timezone!
