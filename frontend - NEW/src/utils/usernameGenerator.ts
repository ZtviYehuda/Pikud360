/**
 * Utility for Hebrew-to-English name transliteration and unique username generation.
 */

const HEBREW_TO_ENGLISH_MAP: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
  'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
  'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm',
  'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
  'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r',
  'ש': 'sh', 'ת': 't',
};

const COMMON_NAMES_MAP: Record<string, string> = {
  'ישראל': 'israel',
  'דוד': 'david',
  'יוסי': 'yossi',
  'יוסף': 'yosef',
  'אבי': 'avi',
  'אברהם': 'avraham',
  'משה': 'moshe',
  'אלון': 'alon',
  'רועי': 'roee',
  'רואי': 'roee',
  'דני': 'dani',
  'דניאל': 'daniel',
  'נועם': 'noam',
  'יונתן': 'yonatan',
  'יהונתן': 'yonatan',
  'מתן': 'matan',
  'אורי': 'uri',
  'אור': 'or',
  'עידו': 'ido',
  'איתי': 'itay',
  'עומר': 'omer',
  'גיא': 'guy',
  'עמית': 'amit',
  'תומר': 'tomer',
  'שחר': 'shahar',
  'ליאור': 'lior',
  'רונן': 'ronen',
  'עמיר': 'amir',
  'אמיר': 'amir',
  'שמעון': 'shimon',
  'שי': 'shai',
  'יובל': 'yuval',
  'אלי': 'eli',
  'אליהו': 'eliyahu',
  'מיכאל': 'michael',
  'דור': 'dor',
  'טל': 'tal',
  'ניר': 'nir',
  'רן': 'ran',
  'כפיר': 'kfir',
  'ערן': 'eran',
  'נדב': 'nadav',
  'יואב': 'yoav',
  'יניב': 'yaniv',
  'אורן': 'oren',
  'אלעד': 'elad',
  'אסף': 'asaf',
  'אוהד': 'ohad',
  'גיל': 'gil',
  'גל': 'gal',
  'חיים': 'haim',
  'יריב': 'yariv',
  'צחי': 'tzahi',
  'שלומי': 'shlomi',
  'תמיר': 'tamir',
  'נפתלי': 'naftali',
  'יהודה': 'yehuda',
  'צבי': 'tzvi',
  'כהן': 'cohen',
  'לוי': 'levi',
  'מזרחי': 'mizrachi',
  'פרץ': 'peretz',
  'ביטון': 'biton',
  'דהן': 'dahan',
  'פרידמן': 'friedman',
  'מלכה': 'malka',
  'אזולאי': 'azoulay',
  'חדד': 'hadad',
  'כץ': 'katz',
  'עמר': 'amar',
  'אוחיון': 'ohayon',
  'ברק': 'barak',
  'גבאי': 'gabbay',
  'שלום': 'shalom',
  'מאיר': 'meir',
  'יעקב': 'yaakov',
  'איתמר': 'itamar',
  'בן': 'ben',
  'בר': 'bar',
  'אריאל': 'ariel',
  'אייל': 'eyal',
  'איל': 'eyal',
};

/**
 * Transliterates Hebrew text into clean English letters.
 */
export function transliterateHebrewToEnglish(text: string): string {
  if (!text) return '';
  const clean = text.trim().toLowerCase();
  if (COMMON_NAMES_MAP[clean]) {
    return COMMON_NAMES_MAP[clean];
  }

  // Character-by-character replacement with fallback
  let result = '';
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (HEBREW_TO_ENGLISH_MAP[ch]) {
      result += HEBREW_TO_ENGLISH_MAP[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      result += ch;
    }
  }
  return result || 'user';
}

/**
 * Generates an English username based on the commander's Hebrew first and last name,
 * ensuring strict uniqueness against existing usernames.
 */
export function generateUniqueUsername(
  firstName: string,
  lastName: string,
  existingUsernames: string[] = []
): string {
  const existingSet = new Set(
    existingUsernames.map((u) => (u || '').toLowerCase().trim())
  );

  const firstEn = transliterateHebrewToEnglish(firstName);
  const lastEn = transliterateHebrewToEnglish(lastName);

  // Candidate generation strategies
  const candidates: string[] = [];

  if (firstEn && lastEn && lastEn !== 'user') {
    candidates.push(`${firstEn}.${lastEn}`);
    candidates.push(`${firstEn}_${lastEn}`);
    candidates.push(`${firstEn}${lastEn.charAt(0)}`);
  }

  if (firstEn) {
    candidates.push(firstEn);
  }

  // Check initial candidates
  for (const candidate of candidates) {
    const cleanCand = candidate.toLowerCase();
    if (!existingSet.has(cleanCand) && cleanCand.length >= 3) {
      return cleanCand;
    }
  }

  // If all basic candidates are taken, append incrementing numbers
  const base = firstEn || 'commander';
  let counter = 1;
  while (existingSet.has(`${base}${counter}`.toLowerCase())) {
    counter++;
  }

  return `${base}${counter}`.toLowerCase();
}
