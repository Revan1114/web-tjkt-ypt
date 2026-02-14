// Vercel Serverless Function - Node.js
// API Key: OPENROUTER_API_KEY di Vercel Environment Variables
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY belum diatur di Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt wajib diisi.' });
    }

    const systemPrompt = `Anda adalah asisten AI untuk website jurusan TJKT. Jawab ringkas, gunakan daftar (-) bila perlu, **tebalkan** istilah kunci. Akhiri dengan "Terimakasih telah bertanya 😊😍".`;

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'https://vercel.app',
        'X-Title': 'AI Konselor TJKT',
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt.trim() },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || `HTTP ${resp.status}` });
    }

    const choices = data.choices || [];
    if (!choices.length) {
      return res.status(500).json({ error: 'AI tidak memberikan jawaban.' });
    }

    const msg = choices[0]?.message || choices[0] || {};
    let text = typeof msg.content === 'string' ? msg.content : '';
    if (!text && msg.content) {
      const parts = Array.isArray(msg.content) ? msg.content : [msg.content];
      text = parts.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('');
    }

    return res.status(200).json({ text: (text || '').trim() });
  } catch (err) {
    console.error('API ask-ai:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan.' });
  }
};
