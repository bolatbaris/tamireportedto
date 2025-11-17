/**
 * 2025-2027 yılları için Türkiye resmi tatil günleri
 * Format: YYYY-MM-DD
 */
export const HOLIDAYS: string[] = [
'2025-03-30', // Ramazan Bayramı 1. Gün
  '2025-03-31', // Ramazan Bayramı 2. Gün
  '2025-04-01', // Ramazan Bayramı 3. Gün
  '2025-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
  '2025-05-01', // Emek ve Dayanışma Günü
  '2025-05-19', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  '2025-06-05', // Kurban Bayramı Arifesi (0.5 gün)
  '2025-06-06', // Kurban Bayramı 1. Gün
  '2025-06-07', // Kurban Bayramı 2. Gün
  '2025-06-08', // Kurban Bayramı 3. Gün
  '2025-06-09', // Kurban Bayramı 4. Gün
  '2025-07-15', // Demokrasi ve Millî Birlik Günü
  '2025-08-30', // Zafer Bayramı
  '2025-10-28', // Cumhuriyet Bayramı Arifesi (0.5 gün, 13:00 sonrası)
  '2025-10-29', // Cumhuriyet Bayramı (1 gün)

  // 2026 (Doğrulanmış Veri Seti)
  '2026-01-01', // Yılbaşı
  '2026-03-19', // Ramazan Bayramı Arifesi (0.5 gün)
  '2026-03-20', // Ramazan Bayramı 1. Gün
  '2026-03-21', // Ramazan Bayramı 2. Gün
  '2026-03-22', // Ramazan Bayramı 3. Gün
  '2026-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
  '2026-05-01', // Emek ve Dayanışma Günü
  '2026-05-19', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  '2026-05-26', // Kurban Bayramı Arifesi (0.5 gün)
  '2026-05-27', // Kurban Bayramı 1. Gün
  '2026-05-28', // Kurban Bayramı 2. Gün
  '2026-05-29', // Kurban Bayramı 3. Gün
  '2026-05-30', // Kurban Bayramı 4. Gün
  '2026-07-15', // Demokrasi ve Millî Birlik Günü
  '2026-08-30', // Zafer Bayramı
  '2026-10-28', // Cumhuriyet Bayramı Arifesi (0.5 gün, 13:00 sonrası)
  '2026-10-29', // Cumhuriyet Bayramı

  // 2027 (Doğrulanmış Veri Seti)
  '2027-01-01', // Yılbaşı
  '2027-03-08', // Ramazan Bayramı Arifesi (0.5 gün)
  '2027-03-09', // Ramazan Bayramı 1. Gün
  '2027-03-10', // Ramazan Bayramı 2. Gün
  '2027-03-11', // Ramazan Bayramı 3. Gün
  '2027-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
  '2027-05-01', // Emek ve Dayanışma Günü
  '2027-05-15', // Kurban Bayramı Arifesi (0.5 gün)
  '2027-05-16', // Kurban Bayramı 1. Gün
  '2027-05-17', // Kurban Bayramı 2. Gün
  '2027-05-18', // Kurban Bayramı 3. Gün
  '2027-05-19', // Kurban Bayramı 4. Gün / Gençlik ve Spor Bayramı (ÇAKIŞMA)
  '2027-07-15', // Demokrasi ve Millî Birlik Günü
  '2027-08-30', // Zafer Bayramı
  '2027-10-28', // Cumhuriyet Bayramı Arifesi (0.5 gün, 13:00 sonrası)
  '2027-10-29', // Cumhuriyet Bayramı
];

/**
 * Verilen tarihin tatil günü olup olmadığını kontrol eder
 */
export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateString);
}

/**
 * Verilen tarihin hafta sonu olup olmadığını kontrol eder
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Pazar, 6 = Cumartesi
}

/**
 * Verilen tarihin tatil veya hafta sonu olup olmadığını kontrol eder
 */
export function isNonWorkingDay(date: Date): boolean {
  const year = date.getFullYear();
  
  if (year > 2027) {
    console.warn(`⚠️ Warning: Holiday data not available for year ${year}. System will only check weekends.`);
  }
  
  return isWeekend(date) || isHoliday(date);
}

