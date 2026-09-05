// api/claude.js
// A minimal serverless proxy so the browser never sees the real API key.
// Routes through OpenRouter (https://openrouter.ai), which the organizer's
// key is for (keys starting with sk-or-v1- are OpenRouter keys, not
// Anthropic keys — Anthropic's native API only accepts keys starting
// sk-ant-api03-, which is why this used to 401 against api.anthropic.com).
//
// OpenRouter exposes an OpenAI-compatible /chat/completions endpoint, which
// has a different request/response shape than Anthropic's native /v1/messages
// endpoint. This proxy translates between the two so that index.html can
// keep sending/receiving the same {system, messages, max_tokens} /
// {content: [{type: "text", text}]} shape it always has — no client-side
// changes needed for this swap.
//
// Deploy this on Vercel: put this file at /api/claude.js in your repo,
// set OPENROUTER_API_KEY as an environment variable in the Vercel project
// settings (never commit the key itself), and Vercel auto-deploys this
// as a live endpoint at: https://<your-project>.vercel.app/api/claude

// Vercel's Hobby plan defaults serverless functions to a 10-second timeout,
// which is easily exceeded by this endpoint's final-summary call (a long
// system prompt plus up to 1500 output tokens routinely takes longer than
// that). Explicitly raising this to 60s — the Hobby plan max without Fluid
// compute — fixes calls that were silently failing due to Vercel's own
// platform timeout, not anything wrong with the API key or the code.
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    // Fails loudly and clearly instead of letting OpenRouter return an
    // opaque 401 that the client would otherwise have to guess the cause of.
    return res.status(500).json({
      error: "Server is missing OPENROUTER_API_KEY. Set it in the Vercel project's Environment Variables (Settings > Environment Variables) and redeploy."
    });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    // Translate the Anthropic-shaped {system, messages} into the
    // OpenAI-shaped messages array OpenRouter expects.
    const openaiMessages = [];
    if (system) {
      openaiMessages.push({ role: "system", content: system });
    }
    for (const m of (messages || [])) {
      openaiMessages.push({ role: m.role, content: m.content });
    }

    // Guard against a hung upstream request outlasting the serverless
    // function's own execution limit. Kept a few seconds below the 60s
    // maxDuration configured above, so this fires with a clear message
    // before Vercel's own platform-level timeout would kill the function
    // with a much less useful error.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // stays server-side only
          // Optional per OpenRouter's docs (used for their app rankings) —
          // harmless to include, safe to leave as-is or edit later.
          "HTTP-Referer": "https://claim-companion.vercel.app",
          "X-Title": "Claim Companion"
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4.6",
          max_tokens: max_tokens || 1500,
          messages: openaiMessages
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Translate the OpenAI-shaped response back into the
    // {content: [{type: "text", text}]} shape index.html already expects.
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    if (!text) {
      return res.status(502).json({ error: "OpenRouter returned no text content.", raw: data });
    }

    return res.status(200).json({ content: [{ type: "text", text: text }] });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request to the model timed out. Please try again." });
    }
    return res.status(500).json({ error: err.message || "Proxy request failed." });
  }
}
