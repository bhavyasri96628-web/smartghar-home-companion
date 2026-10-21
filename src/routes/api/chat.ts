import { createFileRoute } from "@tanstack/react-router";
import { fallbackAnswer } from "@/lib/fallback";

const SYSTEM =
  "You are SmartGhar, a friendly home helper for families (often in India). Help with household problems: electricity saving, cleaning, cooking with available ingredients, home organization and chores. Give short, practical, step-by-step answers in markdown. Politely steer off-topic questions back to home topics.";

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let messages: Msg[] = [];
        try {
          const body = await request.json();
          messages = (body.messages ?? [])
            .filter((m: Msg) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-20)
            .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 4000) }));
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!messages.length) return Response.json({ error: "Please type a question." }, { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        const last = messages[messages.length - 1]!.content;
        if (!key) return Response.json({ mode: "offline", text: fallbackAnswer(last) });

        const { createOpenAI } = await import("@ai-sdk/openai");
        const { streamText } = await import("ai");
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const result = streamText({
          model: openai.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          messages,
          maxRetries: 0,
          abortSignal: request.signal,
          providerOptions: {
            openai: { forceReasoning: true, reasoningEffort: "low", store: false },
          },
          onError: ({ error }) => console.error("AI error", error),
        });
        return result.toTextStreamResponse({
          headers: { "X-Mode": "live", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
