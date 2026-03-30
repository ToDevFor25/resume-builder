module.exports = async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, resumeText } = req.body || {};

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

    const prompt = `
You are an expert executive resume writer.

Task:
Rewrite and optimize the candidate's resume for the job description provided.

Rules:
- Keep the output truthful.
- Do not invent experience.
- Improve alignment to the role.
- Preserve strong executive tone.
- Use concise, high-impact bullets.
- Return plain text only.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeText}
`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
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

    const output =
      data?.content?.[0]?.text || 'No output returned from Anthropic.';

    return res.status(200).json({ result: output });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
};
