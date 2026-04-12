import { API_URL } from "@/lib/api";

export type ChategyMode = "gemini" | "bot" | "code-execution" | "file-analysis";

export type ChategyResponse =
  | { mode: "gemini"; data: unknown }
  | { mode: "bot"; data: unknown }
  | { mode: "code-execution"; data: unknown }
  | { mode: "file-analysis"; data: unknown };

type PromptPayload = {
  prompt: string;
  mode: Exclude<ChategyMode, "file-analysis">;
};

type FilePayload = {
  file: File;
  prompt?: string;
};

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Request failed with ${res.status}` }));
    throw new Error(error.message ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

async function requestFormData<T>(path: string, data: FormData): Promise<T> {
  const res = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Request failed with ${res.status}` }));
    throw new Error(error.message ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export const chategyApi = {
  sendPrompt: async ({ mode, prompt }: PromptPayload): Promise<ChategyResponse> => {
    if (mode === "gemini") {
      const data = await requestJson("gemini", { prompt });
      return { mode, data };
    }

    if (mode === "bot") {
      const data = await requestJson("bot/create", { role: "user", content: prompt });
      return { mode, data };
    }

    const data = await requestJson("code-execution", { problem: prompt });
    return { mode, data };
  },

  analyzeFile: async ({ file, prompt }: FilePayload): Promise<ChategyResponse> => {
    const form = new FormData();
    form.append("file", file);
    if (prompt?.trim()) {
      form.append("prompt", prompt.trim());
    }

    const data = await requestFormData("file-analysis", form);
    return { mode: "file-analysis", data };
  },
};
