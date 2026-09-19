// Kimi API（OpenAI 兼容）轻量客户端 —— 无额外依赖，直接 fetch。
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface KimiChatOptions {
  model: string;
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
}

export async function kimiChat({ model, messages, json, temperature }: KimiChatOptions): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  const baseUrl = process.env.KIMI_BASE_URL ?? "https://api.moonshot.ai/v1";
  if (!apiKey) throw new Error("Missing KIMI_API_KEY");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      // 部分 Kimi 模型只接受 temperature=1；不传则由服务端用默认值
      ...(temperature !== undefined ? { temperature } : {}),
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kimi API ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Kimi API 返回为空");
  return content;
}

export const BRIEF_MODEL = () => process.env.KIMI_MODEL_BRIEF ?? "kimi-k3";
export const ENRICH_MODEL = () => process.env.KIMI_MODEL_ENRICH ?? "kimi-k2.6";

// 模型即使开了 json_object 也可能包 ```json 围栏 —— 统一剥离后解析
export function parseJsonContent<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
