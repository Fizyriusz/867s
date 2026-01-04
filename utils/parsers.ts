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
export const parseLevel = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number') return raw
  if (!raw) return 0

  const str = raw.toString().trim()

  // Przypadek 1: Format "Lv. XX" lub "Lv XX"
  if (str.toLowerCase().includes('lv')) {
    // Usuwamy wszystko co nie jest cyfrą
    const num = str.replace(/[^0-9]/g, '')
    return parseInt(num) || 0
  }

  // Przypadek 2: Same cyfry (True Gold lub ktoś wpisał sam numer)
  const num = parseInt(str)
  
  if (!isNaN(num)) {
    // Jeśli to mała cyfra (1-5), traktujemy jako True Gold (ponad 30)
    // UWAGA: Zakładamy, że nikt nie wpisuje ręcznie "1" mając Lv 1 ratusza (to nierealne w topce)
    if (num >= 1 && num <= 5) {
      return 30 + num // Gold 1 = 31, Gold 5 = 35
    }
    // W innym przypadku (np. "29") zwracamy jak jest
    return num
  }

  return 0
}