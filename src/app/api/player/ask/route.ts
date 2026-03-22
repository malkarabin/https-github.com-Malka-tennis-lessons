import { NextRequest, NextResponse } from "next/server";
import { getCoach, getPlayer, listPlayersByCoach, addLesson, removeLesson, cancelRecurringOccurrence } from "@/lib/store";
import { getMergedLessons } from "@/lib/merged-lessons";

type ChatMsg = { role: "user" | "assistant"; content: string };

const MAX_MESSAGE = 4000;
const MAX_HISTORY = 12;

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

/** Parse dd/mm/yy → Date (local midnight). Returns null if invalid. */
function parseDdMmYy(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10) < 100 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  const d = new Date(year, month, day);
  if (d.getDate() !== day || d.getMonth() !== month) return null;
  return d;
}


/**
 * POST /api/player/ask — שחקן שואל שאלה; תומך גם בקביעת שיעור דרך function calling.
 * דורש OPENAI_API_KEY ב-.env.local
 */
export async function POST(req: NextRequest) {
  let body: {
    coachId?: string;
    playerId?: string;
    message?: string;
    history?: ChatMsg[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const coachId = typeof body.coachId === "string" ? body.coachId.trim() : "";
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!coachId || !playerId) {
    return NextResponse.json({ error: "חסרים פרטי מאמן או שחקן" }, { status: 400 });
  }

  const player = getPlayer(playerId);
  if (!player || player.coachId !== coachId) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }

  if (!message) {
    return NextResponse.json({ error: "נא להזין שאלה" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "השאלה ארוכה מדי" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "לא הוגדר מפתח API. הוסיפי OPENAI_API_KEY לקובץ .env.local (ראו docs/env-llm.md)." },
      { status: 503 }
    );
  }

  const coach = getCoach(coachId);
  const coachName = coach?.name ?? "המאמן";
  const playerName = player.name;

  // Build schedule context for the next 4 weeks
  const now = new Date();
  const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  const allPlayers = listPlayersByCoach(coachId);
  const playerMap = new Map(allPlayers.map((p) => [p.id, p.name]));

  const allLessons = getMergedLessons(coachId, now, fourWeeksLater);

  // Group lessons by day
  const byDay = new Map<string, typeof allLessons>();
  for (const l of allLessons) {
    const d = new Date(l.start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(l);
  }

  const ALL_HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20];

  const scheduleByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, lessons]) => {
      const d = new Date(`${dateKey}T12:00:00`);
      const dayHe = DAYS_HE[d.getDay()];
      const dateStr = fmtDate(d);
      const takenHours = lessons.map((l) => new Date(l.start).getHours());
      const takenLines = lessons
        .map((l) => {
          const h = new Date(l.start).getHours();
          const who = playerMap.get(l.playerId) ?? l.playerId;
          const isMe = l.playerId === playerId ? " (השיעור שלך)" : "";
          return `  ${String(h).padStart(2,"0")}:00–${String(h+1).padStart(2,"0")}:00 — ${who}${isMe}`;
        })
        .join("\n");
      const freeHours = ALL_HOURS.filter((h) => !takenHours.includes(h))
        .map((h) => `${String(h).padStart(2,"0")}:00–${String(h+1).padStart(2,"0")}:00`)
        .join(", ");
      return `### יום ${dayHe} ${dateStr} (${dateKey})\nתפוס:\n${takenLines}\nפנוי לחלוטין (כל אחת מהשעות הבאות היא שיעור עצמאי פנוי): ${freeHours}`;
    })
    .join("\n\n");

  const systemPrompt = `אתה עוזר וירטואלי שמסייע לשחקנים שמתאמנים אצל המאמן ${coachName} בשיעורי טניס.
ענה בעברית, בטון אדיב, מקצועי וקצר ככל שניתן.
שם השחקן שכותב: ${playerName}. תאריך היום: ${fmtDate(now)}.

## לוח המאמן ב-4 השבועות הקרובים — לפי ימים:
${scheduleByDay || "אין שיעורים רשומים בטווח הקרוב."}

## ימים ללא שיעורים כלל הם פנויים לחלוטין בכל שעות 07:00–20:00.

## כללי זמינות — חובה לפעול לפיהם במדויק:
- שעות עבודה: 07:00 עד 20:00 בלבד (שעות שלמות בלבד).
- כל שיעור הוא בדיוק 60 דקות. שיעור שמתחיל ב-10:00 מסתיים ב-11:00 בדיוק — ו-11:00 **פנוי לחלוטין**.
- הלוח למעלה הוא הרשימה המלאה של כל השיעורים התפוסים. **אין מידע נסתר מעבר לרשום בו.**
- שעה היא תפוסה **אך ורק** אם מחרוזת "XX:00–YY:00 — שם" מופיעה מפורשות תחת "תפוס".
- כל שעה המופיעה תחת "פנוי לחלוטין" היא **פנויה ב-100%** — ללא יוצא מן הכלל, גם אם היא צמודה לשיעור לפניה או אחריה.
- **אסור בהחלט** להסיק שמאמן תפוס בשעה X כי יש שיעור ב-X-1 או ב-X+1. אין buffer, אין הכנה.
- דוגמה: אם תפוס 10:00–11:00 ו-13:00–14:00, אזי 11:00, 12:00, 14:00 ועוד **פנויים לחלוטין**.
- **אסור בהחלט** לקבוע שיעור בתאריך או שעה שכבר עברו (לפני ${fmtDate(now)} שעה ${String(now.getHours()).padStart(2,"0")}:00). אם מבקשים תאריך עבר — סרב בנימוס והסבר שלא ניתן.
- אם השחקן רוצה לקבוע שיעור בשעה פנויה בעתיד — קרא לכלי book_lesson מיד ללא בקשת אישור נוסף.
- אם השעה תפוסה — הסבר מי תפוס אותה בדיוק (לפי הלוח) והצע חלופות פנויות.
- אם השחקן רוצה לבטל שיעור שלו — קרא לכלי cancel_lesson. ניתן לבטל רק מיום המחר והלאה. שיעור של היום — הפנה ל${coachName} ישירות.
- לעניינים אישיים, רפואיים, משפטיים או חשבוניות — הפנה ל${coachName} ישירות.
- לשאלות על טכניקת טניס ואימון — תן הנחיות כלליות ומועילות.`;

  const messages: { role: string; content: string | null }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (Array.isArray(body.history)) {
    for (const h of body.history.slice(-MAX_HISTORY)) {
      if (
        h &&
        (h.role === "user" || h.role === "assistant") &&
        typeof h.content === "string" &&
        h.content.trim()
      ) {
        messages.push({ role: h.role, content: h.content.slice(0, 8000) });
      }
    }
  }
  messages.push({ role: "user", content: message });

  const tools = [
    {
      type: "function",
      function: {
        name: "book_lesson",
        description: "קובע שיעור טניס לשחקן אצל המאמן. השתמש רק כשהשחקן ביקש לקבוע שיעור והשעה פנויה.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "תאריך השיעור בפורמט dd/mm/yy (למשל 25/03/26)" },
            hour: { type: "integer", description: "שעת תחילת השיעור (מספר שלם בין 7 ל-19)", minimum: 7, maximum: 19 },
          },
          required: ["date", "hour"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancel_lesson",
        description: "מבטל שיעור קיים של השחקן. ניתן לבטל רק שיעורים מיום המחר והלאה — לא שיעורי היום.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "תאריך השיעור לביטול בפורמט dd/mm/yy" },
            hour: { type: "integer", description: "שעת תחילת השיעור לביטול", minimum: 7, maximum: 20 },
          },
          required: ["date", "hour"],
        },
      },
    },
  ];

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  // First LLM call
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0, max_tokens: 1024 }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("LLM API error", res.status, errText);
    return NextResponse.json({ error: "לא ניתן לקבל תשובה כרגע. נסו שוב מאוחר יותר." }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };

  const choice = data.choices?.[0]?.message;
  if (!choice) {
    return NextResponse.json({ error: "תשובה ריקה מהשירות" }, { status: 502 });
  }

  // If no tool call — plain text reply
  if (!choice.tool_calls?.length) {
    const reply = choice.content?.trim();
    if (!reply) return NextResponse.json({ error: "תשובה ריקה מהשירות" }, { status: 502 });
    return NextResponse.json({ reply });
  }

  // Handle book_lesson tool call
  const toolCall = choice.tool_calls[0];
  let toolResult: string;
  let scheduleChanged = false;

  if (toolCall.function.name === "book_lesson") {
    let args: { date?: string; hour?: number };
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      args = {};
    }

    const dateStr = args.date ?? "";
    const hour = args.hour ?? -1;
    const parsedDate = parseDdMmYy(dateStr);

    if (!parsedDate || hour < 7 || hour > 19) {
      toolResult = "שגיאה: פרטי התאריך או השעה אינם תקינים. השתמש בפורמט dd/mm/yy.";
    } else {
      // Check slot is free
      const slotStart = new Date(parsedDate);
      slotStart.setHours(hour, 0, 0, 0);
      if (slotStart.getTime() < Date.now()) {
        toolResult = "לא ניתן לקבוע שיעור בתאריך או שעה שעברו.";
      } else {
        const slotEnd = slotStart.getTime() + 60 * 60 * 1000;
        const conflict = allLessons.find((l) => {
          const lStart = new Date(l.start).getTime();
          const lEnd = lStart + (l.durationMinutes ?? 60) * 60 * 1000;
          return lStart < slotEnd && lEnd > slotStart.getTime();
        });

        if (conflict) {
          const takenBy = playerMap.get(conflict.playerId) ?? conflict.playerId;
          toolResult = `השעה תפוסה על ידי ${takenBy}. לא ניתן לקבוע.`;
        } else if (isNaN(slotStart.getTime())) {
          toolResult = "שגיאה: תאריך לא תקין.";
        } else {
          const lessonId = `lesson-${Date.now()}-${playerId}`;
          const result = addLesson({
            id: lessonId,
            coachId,
            playerId,
            start: slotStart.toISOString(),
            durationMinutes: 60,
          });

          if (result.ok) {
            scheduleChanged = true;
            const dayHe = DAYS_HE[slotStart.getDay()];
            toolResult = `השיעור נקבע בהצלחה! יום ${dayHe} ${fmtDate(slotStart)} בשעה ${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00.`;
          } else {
            toolResult = `לא ניתן לקבוע את השיעור: ${result.error ?? "שגיאה לא ידועה"}.`;
          }
        }
      }
    }
  } else if (toolCall.function.name === "cancel_lesson") {
    let args: { date?: string; hour?: number };
    try { args = JSON.parse(toolCall.function.arguments); } catch { args = {}; }

    const dateStr = args.date ?? "";
    const hour = args.hour ?? -1;
    const parsedDate = parseDdMmYy(dateStr);

    if (!parsedDate || hour < 7 || hour > 20) {
      toolResult = "שגיאה: פרטי התאריך או השעה אינם תקינים.";
    } else {
      const slotStart = new Date(parsedDate);
      slotStart.setHours(hour, 0, 0, 0);

      // Block today
      const startOfTomorrow = new Date();
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      if (slotStart.getTime() < startOfTomorrow.getTime()) {
        toolResult = "לא ניתן לבטל שיעור של היום או שיעורים שעברו. לביטול שיעור היום — פנה/י למאמן ישירות.";
      } else {
        const slotEnd = slotStart.getTime() + 60 * 60 * 1000;
        const lesson = allLessons.find((l) => {
          if (l.playerId !== playerId) return false;
          const lStart = new Date(l.start).getTime();
          const lEnd = lStart + (l.durationMinutes ?? 60) * 60 * 1000;
          return lStart < slotEnd && lEnd > slotStart.getTime();
        });

        if (!lesson) {
          toolResult = `לא נמצא שיעור של ${playerName} ביום ${DAYS_HE[slotStart.getDay()]} ${fmtDate(slotStart)} בשעה ${String(hour).padStart(2,"0")}:00.`;
        } else if (lesson.id.startsWith("rec-")) {
          const lastDash = lesson.id.lastIndexOf("-");
          const seriesId = lesson.id.slice(4, lastDash);
          const timestamp = Number(lesson.id.slice(lastDash + 1));
          const ok = cancelRecurringOccurrence(seriesId, timestamp);
          if (ok) scheduleChanged = true;
          toolResult = ok
            ? `השיעור ביום ${DAYS_HE[slotStart.getDay()]} ${fmtDate(slotStart)} בשעה ${String(hour).padStart(2,"0")}:00 בוטל בהצלחה.`
            : "שגיאה בביטול השיעור החוזר.";
        } else {
          removeLesson(lesson.id);
          scheduleChanged = true;
          toolResult = `השיעור ביום ${DAYS_HE[slotStart.getDay()]} ${fmtDate(slotStart)} בשעה ${String(hour).padStart(2,"0")}:00 בוטל בהצלחה.`;
        }
      }
    }
  } else {
    toolResult = "כלי לא מוכר.";
  }

  // Second LLM call with tool result
  const messagesWithTool = [
    ...messages,
    { role: "assistant", content: choice.content ?? null, tool_calls: choice.tool_calls },
    { role: "tool", tool_call_id: toolCall.id, content: toolResult },
  ];

  const res2 = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: messagesWithTool, temperature: 0.4, max_tokens: 512 }),
  });

  if (!res2.ok) {
    return NextResponse.json({ reply: toolResult, scheduleChanged });
  }

  const data2 = (await res2.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data2.choices?.[0]?.message?.content?.trim() ?? toolResult;
  return NextResponse.json({ reply, scheduleChanged });
}
