import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

// แปลง created_date (string ไม่มี timezone) ให้เป็น Date แบบไม่เพี้ยน (+7)
export function safeDate(ts) {
  if (!ts) return null;

  try {
    const s = String(ts).trim();

    // ถ้าเป็น ISO มี timezone อยู่แล้ว ก็ใช้ตรง ๆ
    // เช่น 2026-02-12T18:00:00Z หรือ +07:00
    if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // ถ้าเป็น "YYYY-MM-DD HH:mm:ss" -> แปลงเป็น ISO แล้วบังคับ UTC ด้วย Z
    const isoLike = s.replace(" ", "T") + "Z";
    const d = new Date(isoLike);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// แสดง "x นาทีที่ผ่านมา" แบบกันพัง
export function timeAgo(ts, opts = {}) {
  const d = safeDate(ts);
  if (!d) return opts.fallback ?? "-";

  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: th,
    ...opts.dateFns,
  });
}