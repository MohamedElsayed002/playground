import { getAllUsersClient, getSingleUserClient, getTotalUsersClient, sendEmailClient } from "@/tools/client"
import { openaiRealtime } from "@tanstack/ai-openai"
import { useEffect, useRef } from "react"
import { useHotkey } from '@tanstack/react-hotkeys'
import { useRealtimeChat } from "@tanstack/ai-react"

export function RealtimeChatPanel() {
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