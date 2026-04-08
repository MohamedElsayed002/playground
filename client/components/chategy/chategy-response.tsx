"use client"

import type { ChategyResponse } from "@/lib/chategy-api"
import { CodeEditor } from "./code-editor"
import { extractCodeSnippets, normalizeShikiLang } from "@/lib/utils"

type Props = {
  response: ChategyResponse | null
}

export function ChategyResponsePanel({ response }: Props) {
  if (!response) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        No response yet. Send a request
      </div>
    )
  }

  const codeSnippets =
    response.mode === "code-execution" ? extractCodeSnippets(response.data) : []

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Source: {response.mode}
      </p>

      {response.mode === "code-execution" && (
        <div className="w-full space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Executed / Generated Code
          </p>
          {codeSnippets.length > 0 ? (
            codeSnippets.map((snippet, index) => (
              <CodeEditor
                key={`${snippet.language}-${index}`}
                lang={normalizeShikiLang(snippet.language)}
                title={snippet.language}
                copyButton
                writing={false}
                className="h-[min(22rem,55vh)] w-full max-w-full"
              >
                {snippet.code}
              </CodeEditor>
            ))
          ) : (
            <pre className="max-h-[min(28rem,50vh)] overflow-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <pre className="max-h-[min(28rem,50vh)] overflow-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(response.data, null, 2)}
      </pre>

      <p className="mt-2">
        {/* @ts-ignore */}
        {response && response.data.analysis}
      </p>
    </div>
  )
}