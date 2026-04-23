/**
 * How many days *before* expiry we treat items as expiring soon (emails + status).
 * Never less than 2 so everyone gets at least ~48h of warnings in the pipeline.
 */
function getNoticeWindowDays() {
  const raw = parseInt(process.env.ALERT_DAYS, 10);
  const n = Number.isFinite(raw) && raw > 0 ? raw : 7;
  return Math.max(2, n);
}

function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.getTime();
}

function isSameUtcDay(a, b) {
  if (!a || !b) return false;
  return startOfUtcDay(a) === startOfUtcDay(b);
}

/** Same calendar day in server local timezone (matches cron “local time”). */
function isSameLocalDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

module.exports = { getNoticeWindowDays, isSameUtcDay, isSameLocalDay, startOfUtcDay };
