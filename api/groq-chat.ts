// Vercel Edge Function — proxies Groq chat completions.
// Keeps GROQ_API_KEY server-side; supports streaming and JSON mode.
export const config = { runtime: 'edge' };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const key = process.env.GROQ_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });

  let body: { messages?: unknown[]; system?: string; json?: boolean };
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (messages.length === 0) return new Response('messages required', { status: 400 });

  const payload: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 2048,
    temperature: 0.6,
    messages: [
      { role: 'system', content: body.system || 'You are Coach, the Study Arena AI tutor. Be motivating, concise and accurate — talk like an elite sports coach who happens to be a brilliant teacher.' },
      ...messages,
    ],
  };

  if (body.json) {
    payload.response_format = { type: 'json_object' };
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: data?.error?.message || 'Groq error' }), { status: 502 });
    return new Response(JSON.stringify({ content: data.choices?.[0]?.message?.content ?? '' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Streaming pass-through (SSE)
  payload.stream = true;
  const upstream = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload),
  });
  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text();
    return new Response(JSON.stringify({ error: err }), { status: 502 });
  }
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
