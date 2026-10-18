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

    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } }
            ]
          }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        })
      }
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      error("Gemini request failed: " + upstream.status);
      const msg = data?.error?.message || "Gemini API request failed.";
      return res.json({ error: msg, status: upstream.status }, 502, corsHeaders);
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
