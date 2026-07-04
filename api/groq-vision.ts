// Vercel Edge Function — Groq Vision. Accepts a base64 data-URL image + task.
export const config = { runtime: 'edge' };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const TASKS: Record<string, string> = {
  extract: 'Extract ALL text from this image exactly as written. Preserve structure, formulas and tables (use markdown tables).',
  summarize: 'Read this image (notes / textbook page) and produce a crisp, well-structured study summary with key points.',
  explain: 'Explain what this image shows (diagram, chart or figure) step by step, as if coaching a student before an exam.',
  solve: 'Solve the question(s) shown in this image. Show clear working and the final answer.',
  flashcards: 'From the content in this image, respond ONLY with JSON: {"cards":[{"front":"...","back":"..."}]} — 6 to 10 cards.',
  quiz: 'From the content in this image, respond ONLY with JSON: {"title":"...","questions":[{"question":"...","options":["a","b","c","d"],"answer_index":0}]} — 5 questions.',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.GROQ_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });

  let body: { image?: string; task?: string; prompt?: string };
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  if (!body.image?.startsWith('data:image/')) return new Response('image (data URL) required', { status: 400 });
  const instruction = body.prompt || TASKS[body.task || 'extract'] || TASKS.extract;
  const wantsJson = body.task === 'flashcards' || body.task === 'quiz';

  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 2048,
      ...(wantsJson ? { response_format: { type: 'json_object' } } : {}),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: instruction },
          { type: 'image_url', image_url: { url: body.image } },
        ],
      }],
    }),
  });
  const data = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ error: data?.error?.message || 'Groq error' }), { status: 502 });
  return new Response(JSON.stringify({ content: data.choices?.[0]?.message?.content ?? '' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
