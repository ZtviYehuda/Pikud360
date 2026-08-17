import { HDate, HebrewCalendar } from "@hebcal/core";

export function getHebrewDate(date: Date) {
  // HDate constructor accepts Date object
  const hDate = new HDate(date);

  // renderGematriya (if available) returns string like "ג׳ שבט תשנ״ד"
  // If types are missing, cast to any to avoid linter blocking valid JS
  const fullStr = (hDate as any).renderGematriya
    ? (hDate as any).renderGematriya()
    : hDate.render();

  // Simple hack to get the day part (first word)
  // This is usually sufficient for calendar day display
  const dayStr = fullStr.split(" ")[0];

  return {
    day: hDate.getDate(),
    month: hDate.getMonthName(),
    year: hDate.getFullYear(),
    dayStr: dayStr,
    fullStr: fullStr,
  };
}

export function getJewishHoliday(date: Date) {
  const hDate = new HDate(date);
  const events = HebrewCalendar.getHolidaysOnDate(hDate) || [];

  const filteredEvents = events.filter((event) => {
    const rawName = event.render("he");
    
    // Strip Nikkud, normalize hyphens/dashes to spaces, and strip quotes for robust matching
    const cleanName = rawName
      .replace(/[\u0591-\u05C7]/g, "") // Strip Nikkud
      .replace(/[\u2010\u2013\u2014\u05BE\-]/g, " ") // Normalize hyphens/maqaf to spaces
      .replace(/[׳״`']/g, "")          // Strip apostrophes/geresh
      .replace(/\s+/g, " ")            // Normalize whitespace
      .trim();

    // 1. Explicit Exclusions (minor/civic/liturgical/diaspora/obscure dates)
    const excludedKeywords = [
      "זבוטינסקי",
      "הרצל",
      "בן גוריון",
      "גוריון",
      "רבין",
      "העליה",
      "העלייה",
      "ירושלים",
      "כיפור קטן",
      "כפור קטן",
      "פורים קטן",
      "סליחות",
      "מעשר",
      "פסח שני",
      "תענית בכורות",
      "סיגד",
      "ניצחון",
      "נצחון",
      "חמישה עשר באב",
      "חמשה עשר באב",
      "שפה",
      "עברית",
      "משפחה",
      "ילד",
    ];

    // Exclude all Special Shabbats (e.g. "שבת החודש", "שבת הגדול", "שבת מברכים")
    if (cleanName.startsWith("שבת ")) return false;

    // Exclude Diaspora 2nd days of Yom Tov (e.g. "שבועות ב", "פסח ב", "סוכות ב")
    if (/\sב$/.test(cleanName) || cleanName.includes(" ב ")) return false;

    if (excludedKeywords.some((keyword) => cleanName.includes(keyword))) {
      return false;
    }

    // 2. Strict Whitelist of Major Official Chagim & Israel National Days
    const majorHolidays = [
      "ראש השנה",
      "צום גדליה",
      "יום כיפור",
      "יום הכיפורים",
      "סוכות",
      "הושענא רבה",
      "שמיני עצרת",
      "שמחת תורה",
      "חנוכה",
      "עשרה בטבת",
      "טו בשבט",
      "תענית אסתר",
      "פורים",
      "שושן פורים",
      "פסח",
      "שביעי של פסח",
      "יום השואה",
      "יום הזיכרון",
      "יום העצמאות",
      "לג בעומר",
      "שבועות",
      "שבעה עשר בתמוז",
      "תשעה באב",
    ];

    return majorHolidays.some((holiday) => cleanName.includes(holiday));
  });

  if (filteredEvents.length > 0) {
    return filteredEvents[0].render("he");
  }
  return null;
}
