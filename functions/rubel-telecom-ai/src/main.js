export default async ({ req, res, log, error }) => {
  const allowedOrigin = "https://viralsadmix-sudo.github.io";
  const origin = req.headers?.origin || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (req.method === "OPTIONS") {
    return res.text("", 204, corsHeaders);
  }
  // Safe health check: confirms deployment and whether the secret exists without exposing it.
  if (req.method === "GET") {
    return res.json({
      service: "Rubel Telecom AI",
      status: "online",
      apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      message: process.env.GEMINI_API_KEY
        ? "AI function is online and the Gemini key is configured."
        : "AI function is online, but GEMINI_API_KEY is missing in Appwrite Variables."
    }, 200, corsHeaders);
  }
  if (req.method !== "POST") {
    return res.json({ error: "POST method required." }, 405, corsHeaders);
  }
  if (origin && origin !== allowedOrigin) {
    return res.json({ error: "Origin not allowed." }, 403, corsHeaders);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ error: "Server is missing GEMINI_API_KEY." }, 500, corsHeaders);
    }

    let body = req.bodyJson || {};
    if (!body || typeof body !== "object" || !Object.keys(body).length) {
      try {
        const rawBody = req.bodyText || req.body || "";
        body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      } catch {
        return res.json({ error: "অনুরোধের তথ্য পড়া যায়নি। আবার চেষ্টা করুন।" }, 400, corsHeaders);
      }
    }
    const imageBase64 = body.imageBase64;
    const mimeType = body.mimeType;
    if (typeof imageBase64 !== "string" || !imageBase64.length) {
      return res.json({ error: "ছবির তথ্য পাওয়া যায়নি।" }, 400, corsHeaders);
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return res.json({ error: "JPG, PNG অথবা WEBP ছবি দিন।" }, 400, corsHeaders);
    }
    // Keep requests small to protect mobile users and avoid oversized API requests.
    if (imageBase64.length > 8_000_000) {
      return res.json({ error: "ছবিটি খুব বড়। ৬ MB-এর কম ছবি ব্যবহার করুন।" }, 413, corsHeaders);
    }

    const prompt = [
      "Enhance the supplied real photograph for natural clarity and quality.",
      "Preserve the person's identity, face shape, facial features, age, skin texture, hairstyle, body, clothing, pose, and scene as faithfully as possible.",
      "Reduce noise and blur, improve focus, lighting, exposure, white balance, and fine detail naturally.",
      "Do not beautify, reshape, invent facial features, change clothes, add objects, or replace the background.",
      "Return the edited photograph as an image, not a description."
    ].join(" ");

    const requestBody = JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } }
        ]
      }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
    });

    // Retry only temporary rate-limit/server responses. A persistent quota limit
    // cannot be bypassed by retrying, so stop after two short retries.
    let upstream;
    let data = {};
    for (let attempt = 0; attempt < 3; attempt++) {
      upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: requestBody
        }
      );
      data = await upstream.json().catch(() => ({}));
      if (upstream.ok || ![429, 500, 502, 503, 504].includes(upstream.status) || attempt === 2) break;
      const retryMs = 1000 * (attempt + 1);
      log("Gemini temporary response " + upstream.status + "; retrying in " + retryMs + "ms (attempt " + (attempt + 1) + "/2).");
      await new Promise(resolve => setTimeout(resolve, retryMs));
    }

    if (!upstream.ok) {
      const msg = data?.error?.message || "Gemini API request failed.";
      error("Gemini request failed: HTTP " + upstream.status + " — " + msg);
      const status = upstream.status === 429 ? 429 : 502;
      return res.json({
        error: upstream.status === 429
          ? "Gemini API-এর ব্যবহারসীমা/কোটা সাময়িকভাবে অতিক্রম হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন। বিস্তারিত: " + msg
          : "Gemini API অনুরোধ ব্যর্থ হয়েছে (HTTP " + upstream.status + "): " + msg,
        status: upstream.status
      }, status, corsHeaders);
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const generated = parts.find(part => part.inlineData?.data);
    if (!generated) {
      const textPart = parts.find(part => part.text)?.text;
      return res.json({
        error: textPart || "AI কোনো সম্পাদিত ছবি ফেরত দেয়নি। API model access বা quota পরীক্ষা করুন।"
      }, 502, corsHeaders);
    }

    log("AI photo enhancement completed.");
    return res.json({
      imageBase64: generated.inlineData.data,
      mimeType: generated.inlineData.mimeType || "image/png"
    }, 200, corsHeaders);
  } catch (e) {
    error("AI photo enhancement error: " + String(e?.message || e));
    return res.json({ error: "AI ছবি উন্নত করতে পারেনি। পরে আবার চেষ্টা করুন।" }, 500, corsHeaders);
  }
};
