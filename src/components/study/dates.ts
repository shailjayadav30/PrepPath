// Helpers for "YYYY-MM-DD" day strings (calendar days, no time zone involved)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

export function addDays(day: string, delta: number) {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

// 0 = Monday ... 6 = Sunday
export const weekdayIndex = (day: string) => (toDate(day).getUTCDay() + 6) % 7;

export const weekdayShort = (day: string) => WEEKDAYS[toDate(day).getUTCDay()];

// "Mon 12 Oct"
export function dayLabel(day: string) {
  const d = toDate(day);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
