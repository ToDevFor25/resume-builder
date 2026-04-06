module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, industry, roleLevel } = req.body || {};

  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = 'appByVPR5T6sGcI79';
  const TABLE_NAME = 'Waitlist';

  if (!AIRTABLE_TOKEN) {
    console.error('AIRTABLE_TOKEN not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Only send non-empty fields
  const fields = { Email: email, Source: 'coming-soon' };
  if (industry)  fields['Industry']   = industry;
  if (roleLevel) fields['Role Level'] = roleLevel;

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Failed to save', detail: data });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('Waitlist error:', err.message);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
};
