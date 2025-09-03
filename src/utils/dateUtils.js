// dateUtils.js
// Utility for zone-aware date handling (Asia/Kolkata)

export function getKolkataISOString(date = new Date()) {
  // Get the date/time in Asia/Kolkata timezone and return ISO string
  const kolkataDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
  return kolkataDate.toISOString();
}

// Usage: getKolkataISOString() or getKolkataISOString(new Date('2025-09-03T14:15:39.087Z'))
