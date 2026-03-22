# Tanstack AI

Tanstack AI is a lightweight, type-safe SDK for building production-ready AI experiences. its framework-agnostic core provides type-safe tool/function calling, streaming responses,amd firest-class React and Solid integrations, with adapters for multiple LLM providers - enabling predictable, composable, and testable AI features across any stack.



## Key Features 

- **Type-Safe**: Full Typescript support with Zod schema inference
- **Streaming**: Built-in streaming support for real-time responses 
- **Isomorphic Tools**: Define once with `toolDefinition` implement with `.server()` or `client()`
- **Framework Agnostic**: Core library works anywhere
- **Multiple Providers**: OpenRouter, OpenAI, Anthropic, Gemini
- **Approval Flow**: Built-in support for tool approval workflows
- **Automatic Execution**: Both server and client tools execute automatiically


```ts
import { chat } from '@tanstack/ai'
import { toolDefinition } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'

// Define a tool
const getProductsDef = toolDefinition({
  name: 'getProducts',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
})

// Create server implementation
const getProducts = getProductsDef.server(async ({ query }) => {
  return await db.products.search(query)
})

// Use in AI chat
chat({
  adapter: openaiText('gpt-5.2'),
  messages: [{ role: 'user', content: 'Find products' }],
  tools: [getProducts]
})
```


---

## Simple Setup Server

First, create an API route that handles chat requests. Here's simplified example:

```ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "OPENAI_API_KEY not configured",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { messages, conversationId } = await request.json();

        try {
          // Create a streaming chat response
          const stream = chat({
            adapter: openaiText("gpt-5.2"),
            messages,
            conversationId,
          });

          // Convert stream to HTTP response
          return toServerSentEventsResponse(stream);
        } catch (error) {
          return new Response(
            JSON.stringify({
              error:
                error instanceof Error ? error.message : "An error occurred",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
```


```ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "OPENAI_API_KEY not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { messages, conversationId } = await request.json();

  try {
    // Create a streaming chat response
    const stream = chat({
      adapter: openaiText("gpt-5.2"),
      messages,
      conversationId
    });

    // Convert stream to HTTP response
    return toServerSentEventsResponse(stream);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```


## Client Setup 

To use the chat API from your React frontend, create a `Chat` component:

```ts
// components/Chat.tsx
import { useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";

export function Chat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === "assistant" ? "text-blue-600" : "text-gray-800"
            }`}
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
                      💭 Thinking: {part.content}
                    </div>
                  );
                }
                if (part.type === "text") {
                  return <div key={idx}>{part.content}</div>;
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Tool Definition

Tools are defined using `toolDefinition()` from `@tanstack/ai`

```ts
import { toolDefintion } from '@tanstack/ai'
import { z } from 'zod'

// Step 1 Define the tool schema
const getWeatherDef = toolDefintion({
  name: 'get_weather'
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().description(),
    unit: z.enum(['cel','fahren']).optional()
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    location: z.string()
  })
})

// Step 2 Create a server implementation 
const getWeatherServer = getWeatherDef.server(async ({location,unit}) => {
  const response = await fetch('..')
  const data = await response.json()
  return {
    temp : data.temperature,
    ..
  }
})
```



### Server-Side

```ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import { openaiText} from "@tanstack/ai-openai"
import { getWeatherDef} from '../tools'

export async function POST(req: Request) {
  const { messages } = await request.json()

  // Create server imp
    const getWeather = getWeatherDef.server(async ({ location, unit }) => {
    const response = await fetch(`https://api.weather.com/v1/current?...`);
    return await response.json();
  });

  const stream = chat({
    adapter: openaiText("gpt-5.2"),
    messages,
    tools: [getWeather]
  })

  return toServerSendEventsResponse(stream)
}
```


## Client-Side 

```ts
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import { 
  clientTools, 
  createChatClientOptions, 
  type InferChatMessages 
} from "@tanstack/ai-client";
import { updateUIDef, saveToStorageDef } from "./tools";

// Create client implementations
const updateUI = updateUIDef.client((input) => {
  // Update UI state
  setNotification(input.message);
  return { success: true };
});

const saveToStorage = saveToStorageDef.client((input) => {
  localStorage.setItem("data", JSON.stringify(input));
  return { saved: true };
});

// Create typed tools array (no 'as const' needed!)
const tools = clientTools(updateUI, saveToStorage);

const textOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/chat"),
  tools,
});

// Infer message types for full type safety
type ChatMessages = InferChatMessages<typeof textOptions>;

function ChatComponent() {
  const { messages, sendMessage } = useChat(textOptions);
  
  // messages is now fully typed with tool names and outputs!
  return <Messages messages={messages} />;
}
```