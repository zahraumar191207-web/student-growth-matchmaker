import { GatewayError, generateResponse } from "@lovable.dev/ai-gateway";

const MODEL = "openai/gpt-6-astra" as const;

type ResponseOutput = Awaited<ReturnType<typeof generateResponse<typeof MODEL>>>;

function extractText(res: ResponseOutput): string {
  const parts: string[] = [];
  for (const item of res.output ?? []) {
    if (item.type === "message") {
      for (const c of item.content) {
        if (c.type === "output_text") parts.push(c.text);
      }
    }
  }
  return parts.join("").trim();
}

export async function askModel(opts: {
  instructions: string;
  input: string;
  json?: { name: string; schema: Record<string, unknown> };
  /** Short label for safe logs. Prompts and outputs are never logged (they may contain names). */
  label: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const started = Date.now();
  const log = (ok: boolean, chars = 0) =>
    console.info(
      JSON.stringify({ ai: opts.label, ok, ms: Date.now() - started, inChars: opts.input.length, outChars: chars }),
    );
  try {
    const res = await generateResponse({
      model: MODEL,
      instructions: opts.instructions,
      input: opts.input,
      reasoning: { effort: "low" },
      ...(opts.json
        ? {
            text: {
              format: {
                type: "json_schema" as const,
                name: opts.json.name,
                schema: opts.json.schema,
                strict: true,
              },
            },
          }
        : {}),
    });
    const text = extractText(res);
    log(Boolean(text), text.length);
    if (!text) return { ok: false, error: "The assistant returned an empty answer. Try again." };
    return { ok: true, text };
  } catch (err) {
    log(false);
    if (err instanceof GatewayError) {
      console.error("AI gateway error", err.code, err.httpStatus, err.ids);
      if (err.httpStatus === 429)
        return { ok: false, error: "The assistant is busy right now. Please wait a moment." };
      if (err.httpStatus === 402)
        return { ok: false, error: "AI credits have run out for this app." };
    } else {
      console.error("AI call failed", err);
    }
    return { ok: false, error: "The assistant couldn't respond. Please try again." };
  }
}
