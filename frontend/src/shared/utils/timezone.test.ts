// Timezone Conversion Test and Debugging

// To test timezone conversions, open browser console and run:

import { getUserTimeZone, convertUTCToLocal, convertLocalToUTC } from './timezone';

// Test 1: Pakistan (Asia/Karachi) timezone
console.log('=== TIMEZONE CONVERSION TEST ===');
console.log('Your detected timezone:', getUserTimeZone());

const testDate = new Date('2026-03-11T00:00:00Z'); // March 11, 2026

// Test Case: Student in Karachi selects 13:00
const karachiTime = '13:00';
const karachiTZ = 'Asia/Karachi';

console.log('\n--- TEST: Student in Karachi selects 13:00 ---');
console.log('Local time in Karachi:', karachiTime);

// Convert to UTC (what gets stored in database)
const utcTime = convertLocalToUTC(karachiTime, testDate, karachiTZ);
console.log('Stored in DB as UTC:', utcTime);
console.log('Expected UTC: 08:00 (Karachi is UTC+5)');

// Convert back to Karachi time (what landlord in Karachi sees)
const backToKarachi = convertUTCToLocal(utcTime, testDate, karachiTZ);
console.log('Landlord in Karachi sees:', backToKarachi);
console.log('Expected: 13:00');

// Test Case 2: Different timezones
console.log('\n--- TEST: Student in New York, Landlord in Tokyo ---');
const nyTime = '14:00';
const nyTZ = 'America/New_York';
const tokyoTZ = 'Asia/Tokyo';

const utcFromNY = convertLocalToUTC(nyTime, testDate, nyTZ);
console.log('Student in NY selects:', nyTime);
console.log('Stored in DB as UTC:', utcFromNY);

const tokyoTime = convertUTCToLocal(utcFromNY, testDate, tokyoTZ);
console.log('Landlord in Tokyo sees:', tokyoTime);

// Expected: NY is UTC-5 (EST), Tokyo is UTC+9
// 14:00 EST = 19:00 UTC = 04:00 JST (next day, but time only)
// (Actually 28:00 = 04:00 the next day, but we only show time)

console.log('\n=== How to use this test ===');
console.log('1. Open browser DevTools Console');
console.log('2. Make sure you can import from this file');
console.log('3. Run the test code above');
console.log('4. Verify the conversions are correct');
console.log('5. Pakistan (Karachi) is UTC+5, so:');
console.log('   - 13:00 Karachi = 08:00 UTC');
console.log('   - If both student and landlord are in Karachi,');
console.log('     they should both see 13:00');
