// api/optimize.js — Vercel serverless function
// The Anthropic API key lives here via environment variable.
// It is never sent to the client.

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { prompt, max_tokens = 2000, temperature = 0 } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens,
        system:
          'You are a senior executive resume writer for healthcare operations, ' +
          'helping Directors target VP roles. NEVER invent companies, titles, dates, ' +
          'degrees, certifications, or metrics not in the original resume. ' +
          'Flag uncertainties as NEEDS_CONFIRMATION. ' +
          'Return ONLY valid JSON, no markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({
        error: err.error?.message || 'Anthropic API error',
      });
    }

    const data = await response.json();
    const text = data.content[0].text
      .trim()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '');

    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
