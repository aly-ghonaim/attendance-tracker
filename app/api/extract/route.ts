import { parseExtraction } from '@/lib/extract';

export const maxDuration = 60;

// Newest first; overloaded (503) or rate-limited (429) models fall through to the next.
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];
const RETRYABLE = new Set([429, 500, 503]);
const MAX_BYTES = 4_000_000; // Vercel rejects request bodies over 4.5 MB
const MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

const PROMPT = `You are reading a university class timetable and/or academic calendar.
Return JSON only.
- courses: every course in the timetable, with one slot per weekly meeting. day: 0=Sunday..6=Saturday. time: 24h "HH:MM" start time. type: "lecture", "lab", "tutorial" etc. as shown.
- start: first day of classes, classesEnd: last day of classes (not the exam period), both "YYYY-MM-DD". Use "" if the files do not say.
- holidays: every break or holiday where there are no classes, as inclusive from/to dates "YYYY-MM-DD" (same date twice for a single day).
Do not invent anything that is not in the files.`;

const str = { type: 'STRING' };
const SCHEMA = {
  type: 'OBJECT',
  required: ['start', 'classesEnd', 'holidays', 'courses'],
  properties: {
    start: str,
    classesEnd: str,
    holidays: { type: 'ARRAY', items: { type: 'OBJECT', required: ['from', 'to'], properties: { from: str, to: str } } },
    courses: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['name', 'slots'],
        properties: {
          name: str,
          slots: {
            type: 'ARRAY',
            items: { type: 'OBJECT', required: ['day', 'time', 'type'], properties: { day: { type: 'INTEGER' }, time: str, type: str } },
          },
        },
      },
    },
  },
};

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const error = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return error('Server is missing GEMINI_API_KEY.', 500);

  const form = await request.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return error('Upload at least one file.', 400);
  if (files.some(f => !MIME_TYPES.has(f.type))) return error('Only PDF, PNG, JPG or WebP files are supported.', 400);
  if (files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) return error('Files are too large (4 MB total limit).', 413);

  const parts: Part[] = [{ text: PROMPT }];
  for (const f of files)
    parts.push({ inlineData: { mimeType: f.type, data: Buffer.from(await f.arrayBuffer()).toString('base64') } });

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
  });
  let res: Response | undefined;
  for (const model of MODELS) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: payload,
      signal: AbortSignal.timeout(25_000),
    }).catch(() => undefined);
    if (res?.ok || (res && !RETRYABLE.has(res.status))) break;
    console.error('Gemini', model, res?.status ?? 'network error/timeout', res ? await res.text() : '');
  }
  if (!res?.ok) {
    if (res && !RETRYABLE.has(res.status)) console.error('Gemini error', res.status, await res.text());
    return error('The AI service is busy right now. Wait a minute and press Extract again.', 503);
  }

  try {
    const body = await res.json();
    return Response.json(parseExtraction(JSON.parse(body.candidates[0].content.parts[0].text)));
  } catch (e) {
    console.error('Bad Gemini output', e);
    return error('Could not read a timetable from those files.', 422);
  }
}
