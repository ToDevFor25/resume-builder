module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      jobDescription,
      resumeText,
      prompt,
      max_tokens,
      temperature
    } = req.body || {};

    if (!jobDescription || !resumeText) {
      return res.status(400).json({
        error: 'Missing jobDescription or resumeText'
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY is not set'
      });
    }

    const finalPrompt =
      prompt ||
      `You are an expert executive resume writer.

Rewrite and optimize the candidate's resume for the job description below.
Keep everything truthful and do not invent experience.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeText}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: max_tokens || 2000,
        temperature: temperature ?? 0,
        messages: [
          {
            role: 'user',
            content: finalPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Anthropic API request failed',
        details: data
      });
    }

    const output = data?.content?.[0]?.text || '';

    return res.status(200).json({ result: output });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
};
