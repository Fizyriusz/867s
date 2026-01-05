/**
 * Zamienia string z mocą na liczbę (BigInt / Number)
 * Obsługuje formaty: "66.9M", "1.2B", "819 364", "224.5M", "500k"
 */
export const parsePower = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number') return raw
  if (!raw) return 0

  // 1. Zamień na wielkie litery i usuń spacje oraz przecinki (np. "819,364" -> "819364")
  const clean = raw.toString().toUpperCase().replace(/[, ]/g, '').trim()

  if (!clean) return 0

  // 2. Obsługa mnożników
  if (clean.endsWith('B')) { // Miliardy
    return Math.round(parseFloat(clean.replace('B', '')) * 1_000_000_000)
  }
  if (clean.endsWith('M')) { // Miliony
    return Math.round(parseFloat(clean.replace('M', '')) * 1_000_000)
  }
  if (clean.endsWith('K')) { // Tysiące
    return Math.round(parseFloat(clean.replace('K', '')) * 1_000)
  }

  // 3. Zwykła liczba (np. "819364")
  return parseInt(clean) || 0
}

/**
 * Zamienia string z levelem na liczbę do sortowania.
 * Obsługuje: "Lv.30", "Lv 25", "1" (True Gold), "5" (True Gold)
 * * Logika True Gold:
 * 1 (Gold) -> 31
 * ...
 * 5 (Gold) -> 35
 */
// utils/parsers.ts

// ... (funkcja parsePower bez zmian) ...

/**
 * Zamienia string z levelem na liczbę do sortowania.
 * Obsługuje: "Lv.30", "Truegold 1", "TG 3", "True Gold 5", "1" (jako TG)
 * * Logika Truegold (TG):
 * TG 1 -> 31
 * TG 5 -> 35
 */
export const parseLevel = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number') return raw
  if (!raw) return 0

  const str = raw.toString().trim().toLowerCase()

  // 1. Obsługa Truegold (TG / True Gold / Truegold)
  // Szukamy fraz: "tg", "true", "gold"
  if (str.includes('tg') || str.includes('true') || str.includes('gold')) {
    const num = str.replace(/[^0-9]/g, '') // Wyciągamy samą cyfrę
    const tgLevel = parseInt(num)
    if (!isNaN(tgLevel)) {
      return 30 + tgLevel // Truegold 1 = 31
    }
  }

  // 2. Obsługa zwykłego levelu "Lv. XX"
  if (str.includes('lv')) {
    const num = str.replace(/[^0-9]/g, '')
    return parseInt(num) || 0
  }

  // 3. Same cyfry (Fallback)
  // Jeśli AI zwróci samą cyfrę "1", "3", "5" -> zakładamy że to Truegold (bo nikt z Lv 5 nie jest w topce)
  const num = parseInt(str)
  if (!isNaN(num)) {
    if (num >= 1 && num <= 8) { // Zapas do TG 8 (gdyby gra wprowadziła nowe)
      return 30 + num 
    }
    return num // Np. 28, 29, 30
  }

  return 0
}