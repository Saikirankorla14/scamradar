// api/chat.js — Vercel serverless proxy for Groq API
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;

  // Debug: tell us exactly what's wrong
  if (!apiKey) {
    return res.status(500).json({
      error:
        "GROQ_API_KEY environment variable is not set on the server. Go to Vercel → Project → Settings → Environment Variables and add it.",
    });
  }

  if (!req.body) {
    return res.status(400).json({ error: "Request body is empty" });
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify(req.body),
      },
    );

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: data?.error?.message || "Groq API error",
        detail: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
