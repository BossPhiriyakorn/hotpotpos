/**
 * JWT `exp` (unix วินาที) = จุดตัดถัดไปเวลา 01:00:00 ตาม Asia/Bangkok
 * - ถ้าตอนนี้ก่อน 01:00 วันนี้ (ไทย) → หมดอายุวันนี้ 01:00
 * - ถ้าตอนนี้หลังหรือเท่ากับ 01:00 วันนี้ (ไทย) → หมดอายุ 01:00 วันถัดไป (ไทย)
 */
export declare function jwtExpSecondsNextBangkok1am(from?: Date): number;
//# sourceMappingURL=jwtExpiryBangkok.d.ts.map