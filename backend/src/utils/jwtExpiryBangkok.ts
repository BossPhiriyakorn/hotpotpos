/**
 * JWT `exp` (unix วินาที) = จุดตัดถัดไปเวลา 01:00:00 ตาม Asia/Bangkok
 * - ถ้าตอนนี้ก่อน 01:00 วันนี้ (ไทย) → หมดอายุวันนี้ 01:00
 * - ถ้าตอนนี้หลังหรือเท่ากับ 01:00 วันนี้ (ไทย) → หมดอายุ 01:00 วันถัดไป (ไทย)
 */
export function jwtExpSecondsNextBangkok1am(from: Date = new Date()): number {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = f.formatToParts(from);
  const g = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
  const Y = g('year');
  const M = g('month');
  const D = g('day');

  // เวลา 01:00 น. บนปฏิทินไทย = UTC hour (1 - 7) ของวันเดียวกันบนแกน UTC
  const today1amMs = Date.UTC(Y, M - 1, D, 1 - 7, 0, 0);
  const nowMs = from.getTime();
  if (nowMs < today1amMs) {
    return Math.floor(today1amMs / 1000);
  }
  const tomorrow1amMs = Date.UTC(Y, M - 1, D + 1, 1 - 7, 0, 0);
  return Math.floor(tomorrow1amMs / 1000);
}
