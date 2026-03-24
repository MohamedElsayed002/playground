'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { useChat, fetchServerSentEvents, useRealtimeChat } from "@tanstack/ai-react";
import { ApprovalPrompt } from "./approval"
import { Badge } from "@/components/ui/badge"

import { useRef, useEffect } from "react"
import { useHotkey } from '@tanstack/react-hotkeys'
import { openaiRealtime } from "@tanstack/ai-openai"
import { getAllUsersClient, getSingleUserClient, getTotalUsersClient, sendEmailClient } from "@/tools/client"

const formSchema = z.object({
    message: z.string().min(3, 'Send Message not less than 3 characters')
})



function RealtimeChatPanel() {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {
        status,
        mode,
        messages: messagesRealtime,
        connect,
        disconnect,
        pendingUserTranscript,
        pendingAssistantTranscript,
    } = useRealtimeChat({
        getToken: () => fetch('/api/realtime-chat', { method: 'POST' }).then(r => r.json()),
        adapter: openaiRealtime(),
        instructions: 'You are helpful voice assistant',
        voice: 'ash',
        tools: [getTotalUsersClient, getSingleUserClient, getAllUsersClient, sendEmailClient]
    })

    const isActive = status !== 'idle'
    const isConnecting = status === 'connecting'

    useHotkey('Control+Shift+S',() => connect())
    useHotkey('Control+Shift+E',() => disconnect())


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messagesRealtime, pendingUserTranscript, pendingAssistantTranscript])

    const statusLabel = isConnecting ? 'Connecting…' : isActive ? 'Live' : 'Idle'
    const statusColor = isConnecting
        ? 'bg-amber-100 text-amber-700'
        : isActive
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'

    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] overflow-hidden flex flex-col" style={{ height: 560 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    {/* Animated dot */}
                    <span className="relative flex h-2.5 w-2.5">
                        {isActive && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">Voice Assistant</h2>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Wave + controls */}
            <div className="flex flex-col items-center gap-3 px-5 py-5 bg-slate-50/60 border-b border-slate-100">

                {/* Transcript line */}
                <p className="text-xs text-slate-400 italic text-center min-h-[16px] leading-relaxed">
                    {pendingUserTranscript
                        ? `You: ${pendingUserTranscript}…`
                        : pendingAssistantTranscript
                            ? `AI: ${pendingAssistantTranscript}…`
                            : isActive
                                ? mode === 'speaking' ? 'Assistant is speaking…' : 'Listening…'
                                : 'Start a conversation to begin'}
                </p>

                {/* Connect/Disconnect button */}
                <button
                    onClick={isActive ? disconnect : connect}
                    disabled={isConnecting}
                    className={`
                        text-xs font-medium px-5 py-2 rounded-full border transition-all duration-200
                        ${isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50 active:scale-95'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isConnecting ? 'Connecting…' : isActive ? 'End Conversation' : 'Start Conversation'}
                </button>
            </div>

            {/* Messages — fixed height, scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                {messagesRealtime.length === 0 && !pendingUserTranscript && !pendingAssistantTranscript ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                        <p className="text-xs">No messages yet</p>
                    </div>
                ) : (
                    <>
                        {messagesRealtime.map((msg) => {
                            const isUser = msg.role === 'user'
                            const text = msg.parts
                                .map(p => p.type === 'text' ? p.content : p.type === 'audio' ? p.transcript : '')
                                .filter(Boolean)
                                .join(' ')
                            if (!text) return null
                            return (
                                <div key={msg.id} className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`
                                        w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold
                                        ${isUser ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                        {isUser ? 'You' : 'AI'}
                                    </div>
                                    {/* Bubble */}
                                    <div className={`
                                        text-xs leading-relaxed px-3 py-2 rounded-2xl max-w-[78%]
                                        ${isUser
                                            ? 'bg-blue-50 text-blue-900 rounded-br-sm border border-blue-100'
                                            : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm'}
                                    `}>
                                        {text}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Pending transcripts */}
                        {pendingUserTranscript && (
                            <div className="flex gap-2 items-end flex-row-reverse">
                                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold bg-blue-100 text-blue-700">You</div>
                                <div className="text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-br-sm max-w-[78%] bg-blue-50 text-blue-900/60 border border-blue-100 italic">
                                    {pendingUserTranscript}…
                                </div>
                            </div>
                        )}
                        {pendingAssistantTranscript && (
                            <div className="flex gap-2 items-end">
                                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold bg-slate-100 text-slate-600">AI</div>
                                <div className="text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm max-w-[78%] bg-white text-slate-500 border border-slate-100 shadow-sm italic">
                                    {pendingAssistantTranscript}…
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}

export default function AdminPage() {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const { sendMessage, messages, isLoading, addToolApprovalResponse } = useChat({
        connection: fetchServerSentEvents("/api/chat")
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: "" }
    })

    const applyShortcutMessage = (text: string) => {
        form.setValue("message", text, { shouldDirty: true, shouldValidate: true })
        form.setFocus("message")
        requestAnimationFrame(() => {
            const el = inputRef.current
            if (!el) return
            el.setSelectionRange(text.length, text.length)
        })
    }

    useHotkey('Control+D', () => applyShortcutMessage("Get user data by id: "))
    useHotkey('Control+U', () => applyShortcutMessage("Update user by id: "))
    useHotkey('Control+Shift+D', () => applyShortcutMessage("Delete user by id: "))
    useHotkey('Control+K', () => applyShortcutMessage("Get users by name: "))
    useHotkey('Control+O', () => applyShortcutMessage("Total users"))

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        sendMessage(values.message)
        form.reset()
    }

    const extractImageUrl = (text: string) => {
        const match = text.match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/i)
        return match ? match[1] : null
    }

    const stripMarkdownImage = (text: string) =>
        text.replace(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi, "").trim()

    const formatJsonLike = (value: unknown) => {
        if (value === null || value === undefined) return "null"
        if (typeof value === "string") {
            try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
        }
        if (typeof value === "object") return JSON.stringify(value, null, 2)
        return String(value)
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fde68a_0%,_#fff7ed_35%,_#eef2ff_75%,_#f8fafc_100%)]">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Message Control Room</h1>
                    <p className="text-slate-600 max-w-2xl">
                        Send prompts and review the full conversation history in one place.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 xl:grid-cols-[340px_1fr_360px] gap-8">

                    {/* ── Left: Compose ── */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Compose Message</h2>
                            <span className="text-xs font-medium text-slate-500">Live</span>
                        </div>

                        <Form {...form}>
                            <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                                <FormField
                                    control={form.control}
                                    name='message'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    type='text'
                                                    placeholder="Type your message..."
                                                    className="h-12 rounded-2xl border-slate-200 bg-white/90 text-slate-900 shadow-sm focus-visible:ring-slate-400"
                                                    ref={inputRef}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Sending..." : "Send Message"}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-6 rounded-2xl bg-slate-900/90 text-slate-100 p-4 text-sm flex flex-col gap-5">
                            <div>
                                <p className="font-medium mb-3">Tools for Chat</p>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge className="bg-orange-400 text-xs">Get User (Ctrl+D)</Badge>
                                    <Badge className="bg-blue-400 text-xs">Update (Ctrl+U)</Badge>
                                    <Badge className="bg-violet-400 text-xs">Delete (Ctrl+Shift+D)</Badge>
                                    <Badge className="bg-red-400 text-xs">By Name (Ctrl+K)</Badge>
                                    <Badge className="bg-cyan-400 text-xs">Total (Ctrl+O)</Badge>
                                </div>
                            </div>
                            <div>
                                <p className="font-medium mb-3">Tools for Realtime Chat</p>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge className="bg-green-400 text-xs">
                                        Start Conversation (Ctrl+Shift+S)
                                    </Badge>
                                    <Badge className="bg-red-400">
                                        End Conversation (Ctrl+Shift+E)
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Center: Chat Messages ── */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] p-6 flex flex-col" style={{ height: 560 }}>
                        <div className="flex items-center justify-between mb-5 flex-shrink-0">
                            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
                            <span className="text-xs font-medium text-slate-500">{messages?.length ?? 0} total</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-4 ${message.role === "assistant" ? "text-blue-600" : "text-gray-800"}`}
                                >
                                    <div className="font-semibold mb-1 text-sm">
                                        {message.role === "assistant" ? "Assistant" : "You"}
                                    </div>
                                    <div>
                                        {message.parts.map((part, idx) => {
                                            if (part.type === 'tool-call' && part.state === 'approval-requested' && part.approval) {
                                                return (
                                                    <ApprovalPrompt
                                                        key={part.id}
                                                        part={part}
                                                        onApprove={() => addToolApprovalResponse({ id: part.approval!.id, approved: true })}
                                                        onDeny={() => addToolApprovalResponse({ id: part.approval!.id, approved: false })}
                                                    />
                                                )
                                            }
                                            if (part.type === "thinking") {
                                                return (
                                                    <div key={idx} className="text-sm text-gray-500 italic mb-2">
                                                        Thinking: {part.content}
                                                    </div>
                                                )
                                            }
                                            if (part.type === "text") {
                                                const imageUrl = extractImageUrl(part.content)
                                                const cleanedContent = stripMarkdownImage(part.content)
                                                return (
                                                    <div key={idx}>
                                                        {imageUrl && (
                                                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                                                                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={imageUrl} alt="User profile" className="h-full w-full object-cover" />
                                                                </div>
                                                                <div className="text-xs text-slate-500">Profile image</div>
                                                            </div>
                                                        )}
                                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                            {cleanedContent || "No content"}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            if (part.type === "tool-result") {
                                                return (
                                                    <pre key={idx} className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 overflow-x-auto">
                                                        {formatJsonLike((part as { content?: unknown; result?: unknown }).content ?? (part as { result?: unknown }).result)}
                                                    </pre>
                                                )
                                            }
                                            if (part.type === "tool-call") {
                                                const toolCall = part as { name?: string; arguments?: string; output?: unknown; state?: string }
                                                return (
                                                    <div key={idx} className="mt-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-700">
                                                        <div className="font-semibold text-slate-900">Tool Call: {toolCall.name ?? "unknown"}</div>
                                                        {toolCall.state && <div className="text-slate-500">State: {toolCall.state}</div>}
                                                        {toolCall.arguments && (
                                                            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2">
                                                                {formatJsonLike(toolCall.arguments)}
                                                            </pre>
                                                        )}
                                                        {toolCall.output !== undefined && (
                                                            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2">
                                                                {formatJsonLike(toolCall.output)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                )
                                            }
                                            return null
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Realtime Voice Chat ── */}
                    <RealtimeChatPanel />

                </div>
            </div>
        </div>
    )
}