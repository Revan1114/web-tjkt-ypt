// Vercel Serverless Function - API Key ada di Vercel Environment Variables
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API Key OpenRouter belum diatur. Tambahkan OPENROUTER_API_KEY di Vercel Environment Variables.',
    });
  }

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt wajib diisi.' });
    }

    const systemPrompt = `Anda adalah asisten AI yang ramah untuk website jurusan TJKT. Jawab pertanyaan dengan ringkas namun informatif, langsung ke intinya. Jika jawabannya berupa daftar, gunakan format daftar (list) dengan tanda hubung (-). Penting: **Tebalkan** nama orang, benda, atau istilah kunci yang menjadi inti jawaban menggunakan format Markdown (contoh: **Teks Tebal**). Di akhir seluruh jawaban, selalu tambahkan baris baru dengan tulisan "Terimakasih telah bertanya 😊😍".`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'https://your-domain.vercel.app',
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.message || `HTTP ${response.status}`,
        raw: data,
      });
    }

    const choices = data.choices || [];
    if (!choices.length) {
      return res.status(500).json({ error: 'AI tidak memberikan jawaban.' });
    }

    const message = choices[0]?.message || choices[0] || {};
    let text = typeof message.content === 'string' ? message.content : (message.content?.[0]?.text || '');
    if (!text && message.content) {
      const parts = Array.isArray(message.content) ? message.content : [message.content];
      text = parts.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('');
    }

    return res.status(200).json({ text: (text || '').trim() });
  } catch (err) {
    console.error('API ask-ai error:', err);
    return res.status(500).json({
      error: err.message || 'Terjadi kesalahan saat memproses permintaan.',
    });
  }
}
