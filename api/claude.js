// api/claude.js
// A minimal serverless proxy so the browser never sees the real API key.
// Deploy this on Vercel: put this file at /api/claude.js in your repo,
// set ANTHROPIC_API_KEY as an environment variable in the Vercel project
// settings (never commit the key itself), and Vercel auto-deploys this
// as a live endpoint at: https://<your-project>.vercel.app/api/claude

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fails loudly and clearly instead of letting Anthropic return an opaque
    // 401 that the client would otherwise have to guess the cause of.
    return res.status(500).json({
      error: "Server is missing ANTHROPIC_API_KEY. Set it in the Vercel project's Environment Variables (Settings > Environment Variables) and redeploy."
    });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    // Guard against a hung upstream request outlasting the serverless
    // function's own execution limit, which would otherwise surface to the
    // client as a generic platform timeout instead of a clear error.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY, // stays server-side only
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: max_tokens || 1500,
          system: system,
          messages: messages
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

    return res.status(200).json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request to Claude timed out. Please try again." });
    }
    return res.status(500).json({ error: err.message || "Proxy request failed." });
  }
}
