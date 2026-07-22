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
    const name = event.render("he");
    
    // Strip Nikkud and normalize punctuation to ensure match works despite vowels
    const cleanName = name
      .replace(/[\u0591-\u05C7]/g, "") // Strip Nikkud
      .replace(/[׳״`"]/g, "'");       // Normalize Geresh/quotes to standard single quote
    
    // Modern minor civic events we want to exclude (all standardized to standard single quote)
    const excludedKeywords = [
      "ז'בוטינסקי",
      "הרצל",
      "בן גוריון",
      "בן-גוריון",
      "רבין",
      "העלייה",
      "העליה",
      "ירושלים",
      "כיפור קטן",
      "כפור קטן",
    ];

    const shouldExclude = excludedKeywords.some((keyword) =>
      cleanName.includes(keyword)
    );

    return !shouldExclude;
  });

  if (filteredEvents.length > 0) {
    // Return the first holiday's Hebrew name
    return filteredEvents[0].render("he");
  }
  return null;
}
