const allowedOrigin = "https://viralsadmix-sudo.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function cleanMessages(message, history) {
  const items = Array.isArray(history) ? history.slice(-10) : [];
  const clean = items
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  clean.push({ role: "user", content: message.slice(0, 4000) });
  return clean;
}

async function askOpenRouter(messages) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://viralsadmix-sudo.github.io/rubel-telecom-/",
      "X-Title": "Rubel Telecom - Sabbir AI"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        { role: "system", content: "তুমি সাব্বির AI, Rubel Telecom-এর বাংলা সহকারী। ব্যবহারকারীর প্রশ্নের প্রাসঙ্গিক, সত্যনিষ্ঠ ও সহায়ক উত্তর বাংলায় দাও। তথ্য জানা না থাকলে তা স্পষ্ট বলো। ফোনে কাজ করে ফেলেছ বলে দাবি করবে না, যদি বাস্তবে কোনো টুল তা না করে।" },
        ...messages.map((m) => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.6
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("OpenRouter request failed (" + response.status + ")");
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("OpenRouter returned no answer");
  return answer.trim();
}

async function askGemini(messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "তুমি সাব্বির AI, Rubel Telecom-এর বাংলা সহকারী। ব্যবহারকারীর প্রশ্নের প্রাসঙ্গিক, সত্যনিষ্ঠ ও সহায়ক উত্তর বাংলায় দাও। তথ্য জানা না থাকলে তা স্পষ্ট বলো। ফোনে কাজ করে ফেলেছ বলে দাবি করবে না, যদি বাস্তবে কোনো টুল তা না করে।" }]
      },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Gemini request failed (" + response.status + ")");
  const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!answer) throw new Error("Gemini returned no answer");
  return answer;
}

export default async ({ req, res, log, error }) => {
  const origin = req.headers?.origin || "";
  const headers = corsHeaders(origin);
  if (req.method === "OPTIONS") return res.json({ ok: true }, 200, headers);
  if (origin && origin !== allowedOrigin) return res.json({ error: "Origin not allowed" }, 403, headers);
  if (req.method !== "POST") return res.json({ error: "Use POST" }, 405, headers);

  let body = req.bodyJson;
  if (!body || typeof body !== "object") {
    try { body = JSON.parse(req.bodyRaw || "{}"); }
    catch { return res.json({ error: "Invalid JSON body" }, 400, headers); }
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return res.json({ error: "প্রশ্ন লিখে পাঠান।" }, 400, headers);
  if (message.length > 4000) return res.json({ error: "প্রশ্নটি ৪০০০ অক্ষরের মধ্যে রাখুন।" }, 413, headers);

  const messages = cleanMessages(message, body.history);
  try {
    let answer;
    if (process.env.OPENROUTER_API_KEY) {
      try { answer = await askOpenRouter(messages); }
      catch (e) {
        log("OpenRouter request failed; trying Gemini fallback.");
        if (!process.env.GEMINI_API_KEY) throw e;
        answer = await askGemini(messages);
      }
    } else if (process.env.GEMINI_API_KEY) {
      answer = await askGemini(messages);
    } else {
      return res.json({ error: "AI সার্ভারে API key সেট করা নেই। Appwrite Function-এর Variables-এ OPENROUTER_API_KEY অথবা GEMINI_API_KEY যোগ করুন।" }, 503, headers);
    }
    return res.json({ answer }, 200, headers);
  } catch (e) {
    error("AI provider request failed: " + (e?.message || "unknown error"));
    return res.json({ error: "AI উত্তর আনতে সমস্যা হয়েছে। API key, model, quota এবং function logs পরীক্ষা করুন।" }, 502, headers);
  }
};
