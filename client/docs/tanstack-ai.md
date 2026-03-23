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

---

## Tool Architecture

The tanstack AI tool system provides a powerful, flexible architecture for enabling AI Agents to interact with external systems

- **Server Tools** execute securely on the backend with automatic handling
- **Client Tools**: execute in the browser for UI updates and local operations
- **The Agentic Cycle**: enables multi-step reasoning and complex workflows
- **Tool States** provide real-time feedback and enable robust UIs
- **Approval Flow** gives users control over sensitive operations This architecture enables building sophisticated AI applications that can:
  - Fetch data from APIs and databases
  - Perform calculations and transformations 
  - Update UIs and manage state
  - Execute multi-step workflows
  - Require user approval for sensitive actions


```ts
import { chat, toServerSentEventsResponse} from "@tanstack/ai"
import { openaiText } from "@tanstack/ai-openai"
import { getWeather, sendEmail } from "./tools"

export async function POST(req: Request) {
  const { messages } = await request.json()

  const stream = chat({
    adapter: openaiText("gpt-5.2"),
    messages,
    tools: [getWeather, sendEmail]
  })

  return toServerSendEventsResponse(stream)
}
```

Client (React Component)

```ts
import { useChat, fetchServerSentEvents} from "@tanstack/ai-react"

function ChatCompnent() {
  const {messages, sendMessage, isLoading} = useChat({
    connection: fetchServerSendEvents("/api/chat")
  })

  return (
    <div></div>
  )
}
```


Monitoring Tool States in React 

```ts
function ChatComponent() {
  const { messages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part) => {
            if (part.type === "tool-call") {
              return (
                <div key={part.id} className="tool-status">
                  {/* Show state-specific UI */}
                  {part.state === "awaiting-input" && (
                    <div>🔄 Calling {part.name}...</div>
                  )}
                  {part.state === "input-streaming" && (
                    <div>📥 Receiving arguments...</div>
                  )}
                  {part.state === "input-complete" && (
                    <div>✓ Arguments ready</div>
                  )}
                  {part.state === "approval-requested" && (
                    <ApprovalUI part={part} />
                  )}
                </div>
              );
            }
            if (part.type === "tool-result") {
              return (
                <div key={part.toolCallId}>
                  {part.state === "complete" && (
                    <div>✓ Tool completed</div>
                  )}
                  {part.state === "error" && (
                    <div>❌ Error: {part.error}</div>
                  )}
                </div>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
}
```


Approval Flow 

For sensitive operations, tools can require user approval before execution:

```ts
const sendEmailDef = toolDefinition({
  name: "send_email",
  description: "Send an email",
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string()
  }),
  needsApproval: true
})

const sendEmail = sendEmailDef.service(async ({to,subject,body}) => {
  await emailService.send({to,subject,body})
  return [ success: true]
})

```

Handle Approval in Client

```ts
const { messages, addToolApprovalResponse} = useChat({
  connection: fetchServerSendEvents("/api/chat")
})

return (
  {part.state === "approval-requested" && (
  <div>
    <p>Approve sending email to {part.arguments.to}?</p>
    <button
      onClick={() =>
        addToolApprovalResponse({
          id: part.approval.id,
          approved: true,
        })
      }
    >
      Approve
    </button>
    <button
      onClick={() =>
        addToolApprovalResponse({
          id: part.approval.id,
          approved: false,
        })
      }
    >
      Deny
    </button>
  </div>
)}
)
```

## Defining Server Tools 

Server tools use the isomorphic `toolDefinition()` API with the `.server()` method

```ts
import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

const getUserDataDef = toolDefinition({
  name: "get_user_data",
  description: "Get user information from the database",
  inputSchema: z.object({
    userId: z.string().description("the user id to loop up"),
    outputSchema: z.object({
      name: z.string(),
      email: z.string().email(),
      createdAt: z.string()
    })
  })
})

const getUserData = getUserDataDef.server(async ({userId}) => {
  const user = await db.users.findUnique({
    where: {
      id: userId
    }
  })
  return {
    ..
  }
})
```


Using Server Tools 

Pass tools to the chat function 


```ts
import { chat, toServerSentEventsResponse} from "@tanstack/ai"
import { openaiText} from "@tanstack/ai-openai"
import { getUserData, searchProducts } from './tools"

export async function POST(request: Request) {
  const { messages}  = await request.json()

  const stream = chat({
    adapter: openaiText('gpt-4o-mini'),
    messages,
    tools: [getUserData,searchProducts]
  })

  return toServerSendEventsResponse(stream)
}
```

## Tool Organization Pattern 

For better organization, define tool schemas and implementations separately 

```ts
// tools/definitions.ts
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const getUserDataDef = toolDefinition({
  name: "get_user_data",
  description: "Get user information",
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export const searchProductsDef = toolDefinition({
  name: "search_products",
  description: "Search products",
  inputSchema: z.object({
    query: z.string(),
  }),
});

// tools/server.ts
import { getUserDataDef, searchProductsDef } from "./definitions";
import { db } from "@/lib/db";

export const getUserData = getUserDataDef.server(async ({ userId }) => {
  const user = await db.users.findUnique({ where: { id: userId } });
  return { name: user.name, email: user.email };
});

export const searchProducts = searchProductsDef.server(async ({ query }) => {
  const products = await db.products.search(query);
  return products;
});

// api/chat/route.ts
import { chat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { getUserData, searchProducts } from "@/tools/server";

const stream = chat({
  adapter: openaiText("gpt-5.2"),
  messages,
  tools: [getUserData, searchProducts],
});
```

---

## Error Handling

Tools should handle errors gracefully:

```tsx
const getUserDataDef = toolDefinition({
  name: "get_user_data",
  description: "Get user information",
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    error: z.string().optional(),
  }),
});

const getUserData = getUserDataDef.server(async ({ userId }) => {
  try {
    const user = await db.users.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: "User not found" };
    }
    return { name: user.name, email: user.email };
  } catch (error) {
    return { error: "Failed to fetch user data" };
  }
});
```

---

## Client Tools

Client tools execute in the browser, enabling UI updates, local Storage access, and browser API interactions. Unlike server tools, client tools don't have an `execute` function in their server defintion 


### When to Use Client Tools 

- **UI Updates**: Show notifications, update forms, toggle visbility 
- **Local Storage**: Save user preferences,  cache data 
- **Browser APIs**: Access geolocation, camera, clipboard
- **State Management**: Update React state
- **Navigation** Change routes, scroll to sections


```tsx
import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

export const updateUIDef = toolDefinition({
  name: "update_ui",
  description: "Update the UI with new information",
  inputSchema: z.object({
    message: z.string().description("Message to display"),
    type: ..
  }),
  outputSchema: z.object9{
    success: z.boolean()
  }
})

export const saveToLocalStorageDef = toolDefinition({
  name: "save_to_local_storage",
  description: "Save data to browser local storage",
  inputSchema: z.object({
    key: z.string().meta({ description: "Storage key" }),
    value: z.string().meta({ description: "Value to store" }),
  }),
  outputSchema: z.object({
    saved: z.boolean(),
  }),
});

```


```ts
import { chat, toServerSendEventsStream } from "@tanstack/ai"
import { openaiText } from "@tanstack/ai-openai"
import { updateUIDef, saveToLocalStorageDef } from "@/tools/definitions";


export async function POST(request: Request) {
  const { messages } = await request.json()

  const stream = chat({
    adapter: openaiText("gpt-5.2),
    messages,
    tools: [updateUIDef, ..]
  })

  return toServerSendEventsStream(stream)
}
```

```tsx
import { useChat, fetchServerSendEvents } from "@tanstack/ai-react"
import {
  clientTools,
  createChatClientOptions,
  type InferChatMessages
} from "@tanstack/ai-client"
import { updateUIDef, saveToLocalStorageDef } from "@/tools/definitions"
import { useState } from "react"

function ChatComponent() {
  const [notifications,setNotification] = useState(null)

  // Step 1: Create client implementations
   const updateUI = updateUIDef.client((input) => {
    // Update React state - fully typed!
    setNotification({ message: input.message, type: input.type });
    return { success: true };
  });

  const saveToLocalStorage = saveToLocalStorageDef.client((input) => {
    localStorage.setItem(input.key, input.value);
    return { saved: true };
  });

  // Step 2: Create typed tools array (no 'as const' needed!)
  const tools = clientTools(updateUI,saveToLocalStorage)

  const chatOptions = createChatClientOptions({
    connection: fetchServerSendEvents("/api/chat"),
    tools
  })

  // Step 3 Infer message types for full type safety 

  type ChatMessages = InferChatMessages<typeof chatOptions>

  const { messages, sendMessage, isLoading} = useChat(chatOptions)

  // Step 4: Render with full type safety 
    return (
    <div>
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}


// Messages component with full type safety
function MessageComponent({ message }: { message: ChatMessages[number] }) {
  return (
    <div>
      {message.parts.map((part) => {
        if (part.type === "text") {
          return <p>{part.content}</p>;
        }
        
        if (part.type === "tool-call") {
          // ✅ part.name is narrowed to specific tool names
          if (part.name === "update_ui") {
            // ✅ part.input is typed as { message: string, type: "success" | "error" | "info" }
            // ✅ part.output is typed as { success: boolean } | undefined
            return (
              <div>
                Tool: {part.name}
                {part.output && <span>✓ Success</span>}
              </div>
            );
          }
        }
      })}
    </div>
  );
}

```

## Best Practices 

- **Keep client tools simple**: Since client tools run in the browser, avoid heavy compulations or large dependencies that could bload your bundle size.
- **Handle erros gracefully**: Define clear error handling in your tool implementations and return meaningful error messages in your output schema
- **Update UI reactively**:  Use your framework's state management to update the UI in response to tool executions
- **Secure sensitive data**: Never store sensistive data (like API keys or personal info) in localStorage or expose it via client tools.
- **Provide feedback** Use tools states to inform users about ongoing operations and results of client tool executions (loading spiiners, success messages, error alerts)
- **Type everything**: Leverage Typescript and Zod schemas for full type safety from tool definitions to implementations to usage
