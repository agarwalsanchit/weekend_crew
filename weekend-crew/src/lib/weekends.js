// Generates upcoming weekends and flags long weekends using US holidays.
// weekend_key = ISO date (YYYY-MM-DD) of the Saturday.

const HOLIDAYS = {
  "2026-06-19": "Juneteenth",
  "2026-07-03": "July 4th (observed)",
  "2026-09-07": "Labor Day",
  "2026-10-12": "Indigenous Peoples' Day",
  "2026-11-26": "Thanksgiving",
  "2026-11-27": "Day after Thanksgiving",
  "2026-12-25": "Christmas",
  "2027-01-01": "New Year's Day",
  "2027-01-18": "MLK Day",
  "2027-02-15": "Presidents' Day",
  "2027-05-31": "Memorial Day",
  "2027-06-18": "Juneteenth (observed)",
  "2027-07-05": "July 4th (observed)",
  "2027-09-06": "Labor Day",
};

const iso = (d) => d.toISOString().slice(0, 10);
const fmt = (d) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const fmtShort = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function getUpcomingWeekends(count = 10) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  // advance to next Saturday (or today if Saturday)
  while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);

  const weekends = [];
  for (let i = 0; i < count; i++) {
    const sat = new Date(d);
    const sun = new Date(d); sun.setUTCDate(sun.getUTCDate() + 1);
    const fri = new Date(d); fri.setUTCDate(fri.getUTCDate() - 1);
    const mon = new Date(d); mon.setUTCDate(mon.getUTCDate() + 2);

    const friHoliday = HOLIDAYS[iso(fri)];
    const monHoliday = HOLIDAYS[iso(mon)];
    const holiday = friHoliday || monHoliday || null;
    const start = friHoliday ? fri : sat;
    const end = monHoliday ? mon : sun;

    weekends.push({
      key: iso(sat),
      label: `${fmtShort(start)}–${fmtShort(end)}`,
      dates: `${fmt(start)} – ${fmt(end)}`,
      long: !!holiday,
      holiday,
      startISO: iso(start),
      // exclusive end for all-day Google Calendar events
      endISOExclusive: iso(new Date(end.getTime() + 86400000)),
    });
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return weekends;
}
