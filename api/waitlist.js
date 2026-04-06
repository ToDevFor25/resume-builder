export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { email, industry, roleLevel } = req.body;

  // Validate email
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = 'appByVPR5T6sGcI79';
  const TABLE_NAME = 'Waitlist';

  if (!AIRTABLE_TOKEN) {
    console.error('Missing AIRTABLE_TOKEN');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: email,
            Industry: industry || '',
            'Role Level': roleLevel || '',
            Source: 'coming-soon',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable error:', data);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
