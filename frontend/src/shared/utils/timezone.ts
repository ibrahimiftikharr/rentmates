/**
 * Time Zone Utility Functions
 * Handles time zone detection and conversion for visit requests
 */

/**
 * Get the user's local IANA time zone
 * @returns IANA time zone string (e.g., "America/New_York")
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a UTC time string to local time
 * @param utcTime - Time in HH:mm format (UTC)
 * @param date - The date for the time
 * @param targetTimeZone - Target IANA time zone (defaults to user's local time zone)
 * @returns Time in HH:mm format in the target time zone
 */
export function convertUTCToLocal(
  utcTime: string,
  date: Date | string,
  targetTimeZone?: string
): string {
  const timeZone = targetTimeZone || getUserTimeZone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  console.log('🔄 convertUTCToLocal:', {
    inputUTC: utcTime,
    targetTimeZone: timeZone,
    date: dateObj.toISOString().split('T')[0]
  });
  
  // Parse UTC time
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a UTC date with the specified time
  const utcDate = new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    hours,
    minutes
  ));
  
  // Format in target time zone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const result = formatter.format(utcDate);
  console.log(`  Result: ${utcTime} (UTC) → ${result} (${timeZone})`);
  
  return result;
}

/**
 * Convert a local time to UTC
 * @param localTime - Time in HH:mm format (local)
 * @param date - The date for the time
 * @param sourceTimeZone - Source IANA time zone (defaults to user's local time zone)
 * @returns Time in HH:mm format in UTC
 */
export function convertLocalToUTC(
  localTime: string,
  date: Date | string,
  sourceTimeZone?: string
): string {
  const tz = sourceTimeZone || getUserTimeZone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Parse local time
  const [hours, minutes] = localTime.split(':').map(Number);
  
  // Get the date components
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  
  console.log('🔄 convertLocalToUTC:', {
    input: localTime,
    sourceTimeZone: tz,
    date: `${year}-${month + 1}-${day}`
  });
  
  // Calculate timezone offset by comparing how the same UTC moment appears in different timezones
  // Create a test date at a specific UTC time (noon)
  const testDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  // Format this date in UTC
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Format the same date in the source timezone
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const utcString = utcFormatter.format(testDate); // Should be "12:00"
  const tzString = tzFormatter.format(testDate);   // e.g., "17:00" if tz is UTC+5
  
  console.log('  Test date (12:00 UTC):', {
    inUTC: utcString,
    inSourceTZ: tzString
  });
  
  // Parse the hours
  const utcHourMatch = utcString.match(/(\d{2}):(\d{2})/);
  const tzHourMatch = tzString.match(/(\d{2}):(\d{2})/);
  
  if (!utcHourMatch || !tzHourMatch) {
    console.error('Failed to parse time formats');
    return '00:00';
  }
  
  const utcHour = parseInt(utcHourMatch[1]);
  const tzHour = parseInt(tzHourMatch[1]);
  
  // Calculate offset: if UTC is 12:00 and source TZ shows 17:00, offset is +5 hours
  // To convert FROM source TZ TO UTC, we subtract the offset
  let offsetHours = tzHour - utcHour;
  
  // Handle day boundary crossings
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;
  
  console.log(`  Calculated offset: UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`);
  
  // Apply offset: local time - offset = UTC time
  const utcHours = (hours - offsetHours + 24) % 24;
  
  const result = `${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  console.log(`  Result: ${localTime} (${tz}) → ${result} (UTC)`);
  
  return result;
}

/**
 * Format a time slot with time zone indication
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @param timeZone - IANA time zone (defaults to user's local time zone)
 * @returns Formatted string like "09:00 - 09:30 EST" or "14:00 - 14:30 (Your local time)"
 */
export function formatTimeSlot(
  startTime: string,
  endTime: string,
  timeZone?: string
): string {
  const tz = timeZone || getUserTimeZone();
  const isLocalTZ = tz === getUserTimeZone();
  
  // Get time zone abbreviation
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short'
  });
  
  const parts = formatter.formatToParts(date);
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';
  
  if (isLocalTZ) {
    return `${startTime} - ${endTime} (Your local time)`;
  }
  
  return `${startTime} - ${endTime} ${tzName}`;
}

/**
 * Add minutes to a time string
 * @param time - Time in HH:mm format
 * @param minutes - Minutes to add
 * @returns New time in HH:mm format
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Format a Date object as YYYY-MM-DD without timezone conversion
 * This preserves the local date regardless of timezone
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
