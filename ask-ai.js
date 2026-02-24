// Vercel Serverless Function - Node.js
// API Key: GEMINI_API_KEY di Vercel Environment Variables
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt wajib diisi.' });
    }

    const systemPrompt = `Anda adalah asisten AI untuk website jurusan TJKT. Jawab ringkas, gunakan daftar (-) bila perlu, **tebalkan** istilah kunci. Akhiri dengan "Terimakasih telah bertanya 😊😍".`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: 'user', parts: [{ text: prompt.trim() }] },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || `HTTP ${resp.status}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'AI tidak memberikan jawaban.' });
    }

    return res.status(200).json({ text: text.trim() });
  } catch (err) {
    console.error('API ask-ai:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan.' });
  }
};
