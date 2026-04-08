"use client"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"
import { Textarea } from "../ui/textarea"
import type { ChategyMode } from "@/lib/chategy-api"

type Props = {
  mode: ChategyMode
  prompt: string
  selectedFile: File | null
  isLoading: boolean
  onModeChange: (mode: ChategyMode) => void
  onPromptChange: (prompt: string) => void
  onFileChange: (file: File | null) => void
  onSubmit: () => void
}

export function ChategyForm({
  mode,
  prompt,
  selectedFile,
  isLoading,
  onModeChange,
  onPromptChange,
  onFileChange,
  onSubmit
}: Props) {
  const isFileMode = mode === 'file-analysis'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Backend Service</Label>
        <Select value={mode} onValueChange={(value) => onModeChange(value as ChategyMode)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            {/* Quota finished */}
            {/* <SelectItem disabled={true} value="gemini">Text Generation</SelectItem> */}
            {/* <SelectItem disabled={true} value="bot">Bot Conversation</SelectItem> */}
            <SelectItem value='code-execution'>Code Execution</SelectItem>
            <SelectItem value="file-analysis">File Analysis (PDF/Image)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{isFileMode ? 'Analysis Prompt (optional)' : 'Prompt'}</Label>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={
            isFileMode ? "Ask what should be extracted from the uploaded file" : "Write your prompt"
          }
          className="min-h-28"
        />
      </div>

      {isFileMode && (
        <div className="space-y-2">
          <Label htmlFor="chategy-file">Upload File</Label>
          <Input
            id="chategy-file"
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onFileChange(file)
            }}
          />
          {selectedFile && <p className="text-xs text-slate-500">Selected: {selectedFile.name}</p>}
        </div>
      )}

      <Button onClick={onSubmit} disabled={isLoading} className="w-full">
        {isLoading ? "Processing.." : "Send"}
      </Button>
    </div>
  )
}