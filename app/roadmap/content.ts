// app/roadmap/content.ts

export type ContentLang = 'pl' | 'en'

// Typ dla pojedynczego zadania na Roadmapie
export type RoadmapItem = {
  status: 'done' | 'in_progress' | 'planned'
  title: Record<ContentLang, string>
  description: Record<ContentLang, string>
}

// Typ dla wpisu w Historii Zmian
export type ChangelogItem = {
  version: string
  date: string
  changes: Record<ContentLang, string[]>
}

// --- DANE: ROADMAPA (PLANY NA PRZYSZŁOŚĆ) ---
export const ROADMAP_DATA: RoadmapItem[] = [
  {
    status: 'planned',
    title: {
      pl: "Wyszukiwarka Globalna",
      en: "Global Search"
    },
    description: {
      pl: "Pasek wyszukiwania pozwalający znaleźć gracza po nicku niezależnie od sojuszu.",
      en: "Search bar to find a player by nickname regardless of alliance."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Profil Gracza (Wykresy)",
      en: "Player Profile (Charts)"
    },
    description: {
      pl: "Indywidualna strona gracza z wykresem historii jego mocy.",
      en: "Individual player page with power history chart."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Audyt Tłumaczeń",
      en: "Translation Audit"
    },
    description: {
      pl: "Poprawki językowe na wszystkich podstronach (pełne PL/EN).",
      en: "Language fixes on all subpages (full PL/EN support)."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Historia Zmian Nicków",
      en: "Name Change History"
    },
    description: {
      pl: "System wykrywający, że gracz zmienił nazwę (np. po ucieczce z sojuszu).",
      en: "System detecting player name changes (e.g., after leaving an alliance)."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Logi Przynależności",
      en: "Alliance History Logs"
    },
    description: {
      pl: "Śledzenie skoczków (Alliance Hoppers) - kto, kiedy i gdzie przeszedł.",
      en: "Tracking Alliance Hoppers - who moved where and when."
    }
  }
]

// --- DANE: CHANGELOG (HISTORIA) ---
export const CHANGELOG_DATA: ChangelogItem[] = [
  {
    version: "v1.1 - Player & Roles",
    date: "2026-01-05",
    changes: {
      pl: [
        "Moduł Graczy: Baza danych, parsowanie 'Truegold' (TG 1-5) i import JSON.",
        "Profil Sojuszu: Lista graczy z podglądem poziomu i przyrostem mocy.",
        "System Uprawnień (RBAC): Podział na Gościa, Rekrutera (hasło) i Admina (hasło).",
        "Strona Celów (/targets): Lista targetów rekrutacyjnych posortowana według siły.",
        "Import 2.0: Nowy interfejs z zakładkami (Sojusze / Gracze / Eventy).",
        "UX: Automatyczne czyszczenie tagów sojuszu (usuwanie nawiasów [ABC])."
      ],
      en: [
        "Player Module: Database, 'Truegold' parsing (TG 1-5), and JSON import.",
        "Alliance Profile: Player list with level badges and power growth.",
        "Permission System (RBAC): Roles for Guest, Recruiter (password), and Admin (password).",
        "Targets Page (/targets): Recruitment targets list sorted by power.",
        "Import 2.0: New interface with tabs (Alliances / Players / Events).",
        "UX: Automatic alliance tag cleaning (removing brackets [ABC])."
      ]
    }
  },
  {
    version: "v1.0 - The Hunter Update",
    date: "2026-01-02",
    changes: {
      pl: [
        "Centrum KvK: Oś czasu wydarzeń, zarządzanie wojną (wyniki Prep/War).",
        "Raporty Boostu: Wyliczanie przyrostu mocy sojuszy w trakcie eventów.",
        "System Statusów: Flagi (Target, Skip, Ally, Farm) + notatki.",
        "Wykrywanie Ruchu: Badge 'NEW' i sekcja 'Spadli z rankingu'.",
        "Wiek Serwera: Licznik dni w nagłówku.",
        "Wielojęzyczność (i18n): Przełącznik PL/EN."
      ],
      en: [
        "KvK Hub: Event timeline, war management (Prep/War results).",
        "Boost Reports: Power growth calculation during events.",
        "Status System: Flags (Target, Skip, Ally, Farm) + notes.",
        "Movement Detection: 'NEW' badges and 'Dropouts' section.",
        "Server Age: Day counter in header.",
        "i18n Support: PL/EN switcher."
      ]
    }
  },
  {
    version: "v0.1 - Genesis (MVP)",
    date: "2025-12-29",
    changes: {
      pl: [
        "Start Projektu: Next.js + Supabase.",
        "Baza Danych: Struktura tabel Sojuszy.",
        "Import: Parser JSON z OCR.",
        "Wykresy: Historia mocy sojuszu."
      ],
      en: [
        "Project Launch: Next.js + Supabase.",
        "Database: Alliances table structure.",
        "Import: JSON parser with OCR.",
        "Charts: Alliance power history."
      ]
    }
  }
]