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
      pl: "Pasek wyszukiwania pozwalający znaleźć gracza po nicku niezależnie od sojuszu (Global Search Bar).",
      en: "Search bar allowing to find a player by nickname regardless of alliance membership."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Profil Gracza (Wykresy)",
      en: "Player Profile (Charts)"
    },
    description: {
      pl: "Indywidualna strona gracza z wykresem historii jego mocy oraz estymacją wzrostu.",
      en: "Individual player page with power history chart and growth estimation."
    }
  },
  {
    status: 'planned',
    title: {
      pl: "Audyt Tłumaczeń",
      en: "Translation Audit"
    },
    description: {
      pl: "Kompleksowy przegląd i poprawki językowe na wszystkich podstronach (pełne wsparcie PL/EN).",
      en: "Comprehensive review and language fixes on all subpages (full PL/EN support)."
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
    version: "v1.1 - Player Module & Roles",
    date: "2026-01-05",
    changes: {
      pl: [
        "Moduł Graczy: Kompletna baza danych, inteligentne parsowanie poziomów 'Truegold' (TG 1-5) oraz import JSON z automatycznym przypisywaniem do sojuszy.",
        "Profil Sojuszu 2.0: Rozbudowany widok z listą graczy, odznakami poziomów (Lv/TG) i automatycznym wyliczaniem przyrostu mocy (Delta) względem poprzednich dni.",
        "System Uprawnień (RBAC): Wprowadzenie ról użytkowników (Gość, Rekruter, Admin). Zabezpieczenie danych wrażliwych i importu hasłami.",
        "Strona Celów (/targets): Dedykowany dashboard dla rekruterów wyświetlający listę celów ('Targets') posortowaną automatycznie według aktualnej siły.",
        "Import Center 2.0: Całkowita przebudowa interfejsu importu – podział na zakładki (Sojusze, Gracze, Eventy) oraz generator osi czasu.",
        "UX & Quality of Life: Automatyczne czyszczenie tagów sojuszy (usuwanie nawiasów []), sortowanie rankingu na dashboardzie i poprawki interfejsu."
      ],
      en: [
        "Player Module: Complete database implementation, smart 'Truegold' level parsing (TG 1-5), and JSON import with automatic alliance assignment.",
        "Alliance Profile 2.0: Enhanced view featuring player lists, level badges (Lv/TG), and automatic power growth calculation (Delta) compared to previous days.",
        "Permission System (RBAC): Introduction of user roles (Guest, Recruiter, Admin). Securing sensitive data and import functions with passwords.",
        "Targets Page (/targets): Dedicated dashboard for recruiters displaying the 'Targets' list automatically sorted by current power.",
        "Import Center 2.0: Total overhaul of the import interface – tabbed navigation (Alliances, Players, Events) and timeline generator.",
        "UX & Quality of Life: Automatic alliance tag cleaning (removing brackets []), dashboard ranking sorting, and interface improvements."
      ]
    }
  },
  {
    version: "v1.0 - The Hunter Update",
    date: "2026-01-02",
    changes: {
      pl: [
        "Centrum KvK: Oś czasu wydarzeń, zarządzanie wojną (wyniki Prep/War) i oznaczanie aktywnego eventu.",
        "Raporty Boostu: Automatyczne wyliczanie przyrostu mocy sojuszy w trakcie trwania eventów.",
        "System Statusów 2.0: Kolorowe flagi (Target, Skip, Ally, Farm) + domyślny status 'Neutral' (szary).",
        "Wykrywanie Ruchu: Badge 'NEW' dla nowych sojuszy i sekcja 'Spadli z rankingu' dla tych, co wypadli z Top 100.",
        "Analityka Dashboardu: Kolumny zmian (Ostatnia, 7 dni, 30 dni) + edytowalne notatki w tabeli.",
        "Wiek Serwera: Automatyczny licznik dni w nagłówku (start od 21.08.2025).",
        "Wielojęzyczność (i18n): Pełne tłumaczenie interfejsu (PL/EN) przełączane w czasie rzeczywistym.",
        "Strona Roadmapy: Dziennik zmian i plany rozwoju (to co właśnie czytasz)."
      ],
      en: [
        "KvK Hub: Event timeline, war management (Prep/War results), and active event tracking.",
        "Boost Reports: Auto-calculation of alliance power growth during events.",
        "Status System 2.0: Colored flags (Target, Skip, Ally, Farm) + default 'Neutral' status (gray).",
        "Movement Detection: 'NEW' badges for entries and 'Dropouts' section for alliances leaving Top 100.",
        "Dashboard Analytics: Change columns (Last, 7d, 30d) + inline editable notes.",
        "Server Age: Automatic day counter in header (start date 21.08.2025).",
        "i18n Support: Full interface translation (PL/EN) with real-time switching.",
        "Roadmap Page: Changelog and development plans (what you are reading now)."
      ]
    }
  },
  {
    version: "v0.1 - Genesis (MVP)",
    date: "2025-12-29",
    changes: {
      pl: [
        "Start Projektu: Konfiguracja Next.js, Supabase i TailwindCSS.",
        "Baza Danych: Struktura tabel dla Sojuszy i Snapshotów historii.",
        "Import Danych: Parser JSON (z OCR) do masowego wgrywania mocy sojuszy.",
        "Wykresy: Wizualizacja historii mocy dla pojedynczego sojuszu.",
        "Wehikuł Czasu: Możliwość przeglądania stanu rankingu z dowolnego dnia w przeszłości."
      ],
      en: [
        "Project Launch: Next.js, Supabase, and TailwindCSS setup.",
        "Database: Schema for Alliances and History Snapshots.",
        "Data Import: JSON parser (from OCR) for bulk alliance power upload.",
        "Charts: Power history visualization for individual alliances.",
        "Time Machine: Ability to view ranking state from any past date."
      ]
    }
  }
]