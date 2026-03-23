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
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";

const formSchema = z.object({
    message: z.string().min(3, 'Send Message not less than 3 characters')
})

export default function AdminPage() {


    const { sendMessage, messages, isLoading } = useChat({
        connection: fetchServerSentEvents("/api/chat")
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: ""
        }
    })


    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        sendMessage(values.message)
        form.reset()
    }

    const extractImageUrl = (text: string) => {
        const match = text.match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/i)
        return match ? match[1] : null
    }

    const stripMarkdownImage = (text: string) => {
        return text.replace(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi, "").trim()
    }



    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fde68a_0%,_#fff7ed_35%,_#eef2ff_75%,_#f8fafc_100%)]">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Message Control Room</h1>
                    <p className="text-slate-600 max-w-2xl">
                        Send prompts and review the full conversation history in one place.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
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

                        <div className="mt-6 rounded-2xl bg-slate-900/90 text-slate-100 p-4 text-sm">
                            <p className="font-medium">Tip</p>
                            <p className="text-slate-300 mt-1">
                                Keep prompts short for faster responses, or add detail for richer outputs.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] p-6 flex flex-col">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
                            <span className="text-xs font-medium text-slate-500">{messages?.length ?? 0} total</span>
                        </div>

                        <div className="mt-6 space-y-4 overflow-y-auto max-h-[520px] pr-2">

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-4 ${message.role === "assistant" ? "text-blue-600" : "text-gray-800"}`}
                                >
                                    <div className="font-semibold mb-1">
                                        {message.role === "assistant" ? "Assistant" : "You"}
                                    </div>

                                    <div>
                                        {message.parts.map((part, idx) => {
                                            if (part.type === "thinking") {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="text-sm text-gray-500 italic mb-2"
                                                    >
                                                        Thinking: {part.content}
                                                    </div>
                                                );
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
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt="User profile"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    Profile image
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                            {cleanedContent || "No content"}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (part.type === "tool-result") {
                                                return (
                                                    <pre
                                                        key={idx}
                                                        className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 overflow-x-auto"
                                                    >
                                                        {JSON.stringify(part.result, null, 2)}
                                                    </pre>
                                                )
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
