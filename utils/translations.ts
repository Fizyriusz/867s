export type Lang = 'pl' | 'en'

export const translations = {
  pl: {
    // Nagłówek & Serwer
    "app.title": "867's HQ",
    "app.subtitle": "Dashboard Rekrutacyjny",
    "nav.timeline": "Oś Czasu",
    "nav.import": "Zarządzanie / Import",
    "server.age": "Dzień Serwera:", // NOWE
    
    // Dashboard Tabela
    "dash.col.tag": "Tag",
    "dash.col.name": "Nazwa Sojuszu",
    "dash.col.power": "Moc",
    "dash.col.diff_last": "Δ Ost.",
    "dash.col.diff_7d": "Δ 7D",
    "dash.col.diff_30d": "Δ 30D",
    "dash.col.status": "Status",
    "dash.col.notes": "Uwagi",
    "dash.no_data": "Brak danych dla wybranej daty",
    "dash.control.date": "Data Raportu:",
    "dash.control.info": "Wybierz datę, aby zobaczyć stan mocy z przeszłości.",
    "dash.control.available": "Dostępne dni:",

    // Timeline / Eventy
    "event.manage": "Zarządzaj",
    "event.show_report": "Pokaż wynik (boost)",
    "event.hide_report": "Ukryj wynik",
    "event.ranking": "Ranking przyrostu mocy:",
    "event.current": "AKTUALNIE TRWA",
    "event.vs": "VS",
    "event.prep": "PREP",
    "event.war": "WOJNA",
    
    // Statusy
    "status.win": "WYGRANA",
    "status.loss": "PRZEGRANA",
    "status.victory": "ZWYCIĘSTWO",
    "status.defeat": "PORAŻKA",
    "status.attack": "Atak",
    "status.defense": "Obrona",

    // --- NOWE: IMPORT PAGE ---
    "import.title": "Panel Zarządzania",
    "import.back": "Wróć do Dashboardu",
    
    "import.gen.title": "Kreator Osi Czasu",
    "import.gen.type": "1. Wybierz Rodzaj",
    "import.gen.date": "2. Data Startu",
    "import.gen.btn": "GENERUJ",
    "import.gen.kvk_num": "Numer KvK",
    
    "import.json.title": "Import Danych (JSON)",
    "import.json.date": "Data Danych:",
    "import.json.placeholder": "Wklej JSON tutaj...",
    "import.json.btn": "IMPORTUJ",
    
    "import.delete.title": "Strefa Usuwania",
    "import.delete.label": "Data do usunięcia",
    "import.delete.btn": "USUŃ DZIEŃ"
  },
  en: {
    // Header & Server
    "app.title": "867's HQ",
    "app.subtitle": "Recruitment Dashboard",
    "nav.timeline": "Timeline",
    "nav.import": "Manage / Import",
    "server.age": "Server Day:", // NEW

    // Dashboard Table
    "dash.col.tag": "Tag",
    "dash.col.name": "Alliance Name",
    "dash.col.power": "Power",
    "dash.col.diff_last": "Δ Last",
    "dash.col.diff_7d": "Δ 7D",
    "dash.col.diff_30d": "Δ 30D",
    "dash.col.status": "Status",
    "dash.col.notes": "Notes",
    "dash.no_data": "No data for selected date",
    "dash.control.date": "Report Date:",
    "dash.control.info": "Select a date to view historical power data.",
    "dash.control.available": "Available days:",

    // Timeline / Events
    "event.manage": "Manage",
    "event.show_report": "Show Report (Boost)",
    "event.hide_report": "Hide Report",
    "event.ranking": "Power Growth Ranking:",
    "event.current": "CURRENTLY ACTIVE",
    "event.vs": "VS",
    "event.prep": "PREP",
    "event.war": "WAR",

    // Statuses
    "status.win": "WIN",
    "status.loss": "LOSS",
    "status.victory": "VICTORY",
    "status.defeat": "DEFEAT",
    "status.attack": "Attack",
    "status.defense": "Defense",

    // --- NEW: IMPORT PAGE ---
    "import.title": "Management Panel",
    "import.back": "Back to Dashboard",
    
    "import.gen.title": "Timeline Creator",
    "import.gen.type": "1. Select Type",
    "import.gen.date": "2. Start Date",
    "import.gen.btn": "GENERATE",
    "import.gen.kvk_num": "KvK Number",
    
    "import.json.title": "Data Import (JSON)",
    "import.json.date": "Data Date:",
    "import.json.placeholder": "Paste JSON here...",
    "import.json.btn": "IMPORT",
    
    "import.delete.title": "Danger Zone",
    "import.delete.label": "Date to delete",
    "import.delete.btn": "DELETE DAY"
  }
}