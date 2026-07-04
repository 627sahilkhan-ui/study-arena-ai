// Vercel Edge Function — sends transactional email via Resend.
export const config = { runtime: 'edge' };

const TEMPLATES: Record<string, (name: string, detail: string) => { subject: string; html: string }> = {
  welcome: (name) => ({
    subject: 'Welcome to the Arena 🏟️',
    html: wrap(`<h1>WELCOME, ${esc(name).toUpperCase()}.</h1>
      <p>Your training starts now. Log your first study session, earn XP and start your streak.</p>
      <p><strong>Train your mind like an athlete.</strong></p>`),
  }),
  achievement: (name, detail) => ({
    subject: `Achievement unlocked: ${detail} 🏅`,
    html: wrap(`<h1>NEW ACHIEVEMENT</h1><p>${esc(name)}, you just unlocked <strong>${esc(detail)}</strong>. Keep the streak alive.</p>`),
  }),
  goal: (name, detail) => ({
    subject: 'Goal completed 🎯',
    html: wrap(`<h1>GOAL COMPLETE</h1><p>${esc(name)}, you finished: <strong>${esc(detail)}</strong>. On to the next one.</p>`),
  }),
  weekly: (name, detail) => ({
    subject: 'Your weekly performance report 📊',
    html: wrap(`<h1>WEEKLY REPORT</h1><p>${esc(name)}, here is your week in the Arena:</p><p>${esc(detail)}</p>`),
  }),
  newsletter: (_n, detail) => ({
    subject: 'You are on the Study Arena AI list 🔥',
    html: wrap(`<h1>YOU'RE IN.</h1><p>Thanks for subscribing${detail ? `, ${esc(detail)}` : ''}. Big things are coming to the Arena.</p>`),
  }),
};

function esc(s: string) { return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string)); }
function wrap(inner: string) {
  return `<div style="background:#090909;color:#fff;font-family:Arial,sans-serif;padding:40px">
    <div style="max-width:560px;margin:auto;background:#141414;border:3px solid #FF2E2E;padding:32px">
      <p style="color:#FF2E2E;font-weight:bold;letter-spacing:2px;margin:0 0 16px">STUDY ARENA AI</p>
      ${inner}
      <p style="color:#A0A0A0;font-size:12px;margin-top:32px">Train your mind like an athlete.</p>
    </div></div>`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });

  let body: { to?: string; type?: string; name?: string; detail?: string };
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!body.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) return new Response('valid "to" required', { status: 400 });

  const make = TEMPLATES[body.type || 'welcome'] || TEMPLATES.welcome;
  const { subject, html } = make(body.name || 'Athlete', body.detail || '');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'Study Arena AI <onboarding@resend.dev>', to: [body.to], subject, html }),
  });
  const data = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ error: data?.message || 'Resend error' }), { status: 502 });
  return new Response(JSON.stringify({ id: data.id }), { headers: { 'Content-Type': 'application/json' } });
}
