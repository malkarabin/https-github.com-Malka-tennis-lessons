# LLM — שאלות שחקנים למאמן

## משתני סביבה

צרי קובץ `.env.local` בשורש הפרויקט (לא לדחוף ל-Git) עם:

```env
OPENAI_API_KEY=sk-...
```

אופציונלי:

```env
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

`OPENAI_BASE_URL` שימושי אם עובדים מול תאימות OpenAI (למשל proxy).

## אפיון

- רק **שחקן** שמחובר (מזהה מאומת בשרת מול `coachId` + `playerId`) יכול לשלוח שאלות.
- התשובות הן מ**עוזר וירטואלי** — לא תחליף לשיחה עם המאמן במצבי קצה (רפואה, חשבוניות).
