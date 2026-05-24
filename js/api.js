// api.js
// On Vercel: calls /api/chat (serverless function) — key stays server-side
// Locally: calls Groq directly using config.js key

const API = {
  model: "llama-3.3-70b-versatile",

  isVercel() {
    return (
      window.location.hostname !== "localhost" &&
      !window.location.hostname.startsWith("127.")
    );
  },

  getLocalKey() {
    const configKey =
      typeof CONFIG !== "undefined" &&
      CONFIG.GROQ_API_KEY &&
      CONFIG.GROQ_API_KEY !== "your_groq_api_key_here"
        ? CONFIG.GROQ_API_KEY
        : "";
    return configKey || sessionStorage.getItem("groq_api_key") || "";
  },

  async call(systemPrompt, userPrompt, maxTokens = 1200) {
    const body = {
      model: this.model,
      max_tokens: maxTokens,
      temperature: 0.85,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    let res;

    if (this.isVercel()) {
      // ── Production: proxy through our serverless function ──
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      // ── Local dev: call Groq directly with config.js key ──
      const key = this.getLocalKey();
      if (!key) throw new Error("NO_KEY");

      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text.replace(/```json|```/g, "").trim();
  },

  async generateScam({ scamType, medium, intensity, target }) {
    const mediumLabels = {
      phone:
        "Phone Call Script (use [CALLER]: and [VICTIM]: prefixes for each line of dialogue)",
      sms: "SMS / Text Message (short, punchy, with link or callback number)",
      email: "Email (include realistic Subject line at very top)",
      voicemail:
        "Voicemail Transcript (monologue only, caller leaving a recorded message)",
      chat: "Chat / Direct Message thread (back and forth messages)",
      letter:
        "Physical Mailed Letter (include fake letterhead, reference numbers, official-looking formatting)",
    };

    const targetDesc = {
      elderly:
        "Target: elderly person (70s), less tech-savvy, possibly on fixed income, trusts authority figures",
      general: "Target: general adult (30s-50s), moderate skepticism",
      professional:
        "Target: working professional, higher income, somewhat skeptical but busy",
      student:
        "Target: college student, limited income, worried about government/financial issues",
    };

    const intensityDesc = {
      low: "Low pressure — friendly tone, soft urgency, no overt threats",
      medium:
        "Medium pressure — clear urgency, consequences mentioned, time limit given",
      high: "High pressure — aggressive threats of arrest/legal action, extreme urgency, fear-based",
    };

    const prompt = `You are a scam awareness researcher. Generate a VERY realistic educational ${scamType} mockup.

Format: ${mediumLabels[medium] || medium}
${intensityDesc[intensity] || ""}
${targetDesc[target] || ""}

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "sender": "spoofed caller ID / number / email / sender name",
  "subject": "email subject line or null",
  "content": "Full realistic scam content minimum 200 words. Include fake badge numbers, case numbers, dollar amounts, deadlines, government agency names, callback numbers. Make it feel completely authentic.",
  "redFlags": [
    "Red flag 1 with specific explanation",
    "Red flag 2 with specific explanation",
    "Red flag 3 with specific explanation",
    "Red flag 4 with specific explanation",
    "Red flag 5 with specific explanation",
    "Red flag 6 with specific explanation"
  ],
  "tactics": ["list", "every", "manipulation", "tactic", "used"],
  "targetProfile": "Why this scam is particularly effective against this target demographic",
  "realism": 92
}`;

    const raw = await this.call(
      "You are a scam awareness educator generating training content. Return only valid JSON.",
      prompt,
      1400,
    );
    return JSON.parse(raw);
  },

  async analyzeText(text) {
    const prompt = `Analyze this message and determine if it is a scam. Return ONLY valid JSON:
{
  "isScam": true,
  "confidence": 87,
  "scamType": "IRS / Tax Scam",
  "redFlags": ["specific red flag 1", "specific red flag 2", "specific red flag 3"],
  "tactics": ["tactic1", "tactic2"],
  "explanation": "Clear explanation of why this is or is not a scam"
}

Message to analyze:
${text}`;

    const raw = await this.call(
      "You are a scam detection expert. Return only valid JSON.",
      prompt,
      700,
    );
    return JSON.parse(raw);
  },
};
