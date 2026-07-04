// Client helpers for the serverless AI endpoints.
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Streams a Groq chat completion; calls onToken for every text chunk. */
export async function streamChat(messages: ChatMessage[], onToken: (t: string) => void, system?: string) {
  const res = await fetch('/api/groq-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system }),
  });
  if (!res.ok || !res.body) throw new Error((await res.text()) || 'AI request failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim();
      if (!data || data === '[DONE]') continue;
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch { /* partial chunk — ignored */ }
    }
  }
}

/** Non-streaming JSON-mode completion (quiz / flashcard generation). */
export async function jsonChat(prompt: string, system: string): Promise<string> {
  const res = await fetch('/api/groq-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], system, json: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI request failed');
  return data.content as string;
}

/** Groq Vision — image is a base64 data URL. */
export async function visionRequest(image: string, task: string): Promise<string> {
  const res = await fetch('/api/groq-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, task }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Vision request failed');
  return data.content as string;
}

export async function sendEmail(to: string, type: string, name?: string, detail?: string) {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, type, name, detail }),
    });
  } catch { /* email is best-effort, never block the UI */ }
}

/** Compress an image file to a JPEG data URL before upload (max 1280px). */
export function compressImage(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read image'));
    img.src = URL.createObjectURL(file);
  });
}
