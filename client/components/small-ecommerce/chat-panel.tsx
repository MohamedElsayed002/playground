"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ApprovalPrompt } from "@/components/admin/approval";

import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import { useEffect, useRef } from "react";

const formSchema = z.object({
  message: z.string().min(3, "Send Message not less than 3 characters"),
});

const MESSAGE_DRAFT_STORAGE_KEY = "small-ecommerce-message-draft";
const MESSAGE_DRAFT_SAVE_DELAY = 300;

export function SmallEcommerceChatPanel() {
  const { sendMessage, messages, isLoading, addToolApprovalResponse } = useChat({
    connection: fetchServerSentEvents("/api/small-ecommerce"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const message = useWatch({ control: form.control, name: "message" });
  const hasHydratedDraft = useRef(false);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(MESSAGE_DRAFT_STORAGE_KEY);
      if (savedDraft) {
        form.setValue("message", savedDraft, { shouldDirty: false });
      }
    } catch {
      // Ignore storage errors in restricted browsers.
    } finally {
      hasHydratedDraft.current = true;
    }
  }, [form]);

  useEffect(() => {
    if (!hasHydratedDraft.current) return;

    const timeoutId = window.setTimeout(() => {
      try {
        if (message) {
          window.localStorage.setItem(MESSAGE_DRAFT_STORAGE_KEY, message);
        } else {
          window.localStorage.removeItem(MESSAGE_DRAFT_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors.
      }
    }, MESSAGE_DRAFT_SAVE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    sendMessage(values.message);
    try {
      window.localStorage.removeItem(MESSAGE_DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    form.reset();
  };

  return (
    <aside className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">AI shopper</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Ask the assistant</h2>
        </div>
      </div>

      <div className="p-5">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Ask for products, cart, checkout..."
                      className="h-11 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:ring-slate-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 rounded-2xl bg-slate-900 p-3 text-slate-100">
          <p className="mb-3 text-xs font-medium">Example prompts</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-orange-400 text-xs">Find phone</Badge>
            <Badge className="bg-blue-400 text-xs">Add to cart</Badge>
            <Badge className="bg-violet-400 text-xs">Checkout</Badge>
            <Badge className="bg-cyan-400 text-xs">Cart summary</Badge>
          </div>
        </div>

        <div className="mt-5 max-h-105 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Start a chat with the shopping assistant.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border p-3 text-sm ${
                  message.role === "assistant"
                    ? "border-blue-100 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-slate-50 text-slate-800"
                }`}
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </div>

                <div className="space-y-2">
                  {message.parts.map((part, idx) => {
                    if (
                      part.type === "tool-call" &&
                      part.state === "approval-requested" &&
                      part.approval
                    ) {
                      return (
                        <ApprovalPrompt
                          key={part.id}
                          part={part}
                          onApprove={() =>
                            addToolApprovalResponse({ id: part.approval!.id, approved: true })
                          }
                          onDeny={() =>
                            addToolApprovalResponse({ id: part.approval!.id, approved: false })
                          }
                        />
                      );
                    }

                    if (part.type === "text") {
                      return <div key={`${message.id}-${idx}`}>{part.content}</div>;
                    }

                    return null;
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
