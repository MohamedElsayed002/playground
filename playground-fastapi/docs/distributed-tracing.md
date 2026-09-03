
# Distributed Tracing 


A distributed system sis the thing you're building. Distributed tracing is one of the tools you use to understand what's happening inside it. 

Distributed System

Next.js/ NestJS/ PostgreSQL/ FastAPI/ Inngest/ Worker/ WorkOS

Distributed Tracing 

Trace/ Spans/ Context propagation/ OpenTelemetry/ Observability platform


---

Important Concepts 

1. Trace
2. Span
3. Context Propagation
4. Instrumentation


"The important thing is: OpenTelemetry is not another logging library" It is as the standard instrumentation
layer that lets you observe a distributed application

**OpenTelemetry, usually abbreviated OTel, is an open-source observability framework for generating and exporting"

```
Traces
Metrics
Logs
```

---

## Trace 

A trace represents one complete operation

For example

```
User Uploads report.pdf
```

That might create 

```
trace_id = 01ABC
```

Everything related to that operation can belong to that trace

Think

```
TRACE = entire movie
```

---

## Span 

A span represents one operation inside the trace

Your PDF processing might look like

```
TRACE abc123
│
├── POST /upload
│
├── S3 upload
│
├── publish Inngest event
│
├── PDF processing
│
├── veraPDF validation
│
├── PDF extraction
│
└── PostgreSQL insert
```

Each of these can be a span For example

```
Span: PDF extraction

start: 12:00:01.100
end:   12:00:08.300

duration: 7.2 seconds
```

Now you immediately know:

    PDF extraction is taking 7.2 seconds

---

## Parent and Child spans

This is important Spans aren't just a flat list.

They form a hierarchy 

For example

```
Trace abc123
│
└── POST /upload
      │
      ├── S3 upload
      │
      └── publish event
```

Then the worker:


```
PDF processing
│
├── download PDF
├── veraPDF
├── extract PDF
└── PostgreSQL
```

So you can think

```
parent span
    │
    ├── child span
    ├── child span
    └── child span
```

This allows the observability system to reconstruct the operation

---

## Span attributes 

A span can contain useful metadata

For example

```
span:
    name = "pdf.extract"

    attributes:
        document.id = "doc_123"
        file.type = "application/pdf"
        file.size = 2450000
```

But be careful. Don't put secrets or sensitive information into traces

---

## Span status 

A span can also tell you whether an operation succeeded

For example

```
PDF extraction
status = OK
```

or 

```
PDF extraction
status = ERROR
exception = PDFParseError
```

So you can find:

```
all traces
    ↓
errors
    ↓
PDF extraction failures
```

---

## Context 

Now we get to the really important part 

Imagine 

```
Next.js 
  ↓
Nestjs
```

Nextjs has `trace_id = ABC` 

Nestjs needs to know "This incoming request belongs to trace ABC"

That context propagation

The tracing context travels with the request

Conceptually

```
Next.js
trace ABC
   │
   │ HTTP request
   │ trace context
   ▼
NestJS
trace ABC
```

Then 

```
NestJS
trace ABC
   │
   │ HTTP request
   │ trace context
   ▼
FastAPI
trace ABC
```

```
             TRACE
              ABC
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
    span001 span002  span003
```

---

## Instrumentation

This how OpenTelemetry actually knows what your application is doing
There are two major approaches

### Automatic instrumentation

The OpenTelemetry ecosystem can instrument common frameworks/libraries for you

For example

```
HTTP server
HTTP client
database
framework
```

Instead of writing 

```ts
const span = tracer.startSpan()
```

everywhere, instrumentation can create spans automatically

This is what you want for most infrastructure

---

### Manual instrumentation

Sometimes you have an important business operation that isn't automatically instrumented

Then you can explicitly create a span

```py
with tracer.start_as_current_span("pdf.extract"):
    extract_pdf()
```

Conceptually

```
Automatic instrumentation
        +
Manual instrumentation
        ↓
       traces
```

--- 

## Architecture 

```
                   YOUR APPLICATION

Next.js ──────┐
              │
NestJS ───────┤
              │
FastAPI ──────┤
              │
Worker ───────┘
       │
       ▼
OpenTelemetry SDK
       │
       ▼
OpenTelemetry Collector
       │
       ├──────────► traces
       ├──────────► metrics
       └──────────► logs
                       │
                       ▼
                Observability UI
```

---

## Why use a collector?

Imagine you send telemetry directly;


```
FastAPI
   ↓
Datadog
```

Later you decide "I want to use Grafana instead"

You may have more coupling to the backend  

With collector

```
FastAPI
   ↓
OpenTelemetry Collector
   ↓
Observability backend
```

Your application talks to the OTel layer
The collector handles more of the telemetry pipeline

```
Next.js ─────┐
NestJS ──────┤
FastAPI ─────┤
Worker ──────┘
       │
       ▼
   Collector
       │
       ├── traces
       ├── metrics
       └── logs
```

                    APPLICATION
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
   Observability                    Audit
          │                             │
   ┌──────┼──────┐                ┌────┴────┐
   │      │      │                │         │
 Logs  Metrics Traces          PostgreSQL WorkOS

---

## Gives me really a powerful debugging experience

Imagine a customer says "I updated the product but it took 5 seconds"

You have:

### Audit 

```
WHO:
user_123

WHAT:
product.updated

WHEN:
12:30
```

Then I have also trace 
```
TRACE abc123

POST /products             5.1s
│
├── NestJS                  5.0s
│
├── PostgreSQL              100ms
│
└── WorkOS                  4.7s 🚨
```


Trace = entire journey

Span = one operation

Context = information that connects operations

Instrumentation = how we observe operations

OpenTelemetry = standard framework for collecting this telemetry