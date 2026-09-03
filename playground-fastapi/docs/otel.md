# Best practices for OpenTelemetry with FastAPI

Here are some best practices for optimizing your OpenTelemetry integration with FastAPI

## 1. Use Distributed Tracing for Microservices

If you have a microservices architecture, ensure you setup context propagation
between services to get a full view of request flow across components

## 2. Set Sampling Rates

If you're concerned about performance overhead or excessive data collection,
configure sampling rates to control how many traces are captured

## 3. Use tags and Attributes

Enrich your spans with custom tags or attributes that help you contextualize the data.
For example, include user IDs or request IDs to track specific users or sessions

## 4. Monitor Key Metrics

In addition to traces, track important metrics like request latency, error rates, and
throughput. This can give you an immediate sense of how your system is performing

## In case where I notice issues, I can start by examining:

- **Traces**: Look at the traces for the slow requests to identify which parts of the
  application causing delays.

- **Metrics**: Metrics like request duration and error rate can help you spot patterns
  and understand whether the issue is widespread or isolated

- **Logs**: Integrated with traces give you even more context, allowing you to tie
  specific events (like database failures or exceptions) to the corresponding traces

My Source: https://last9.io/blog/integrating-opentelemetry-with-fastapi/

<img src="../../jaeger-otel.png">

My Investigation starts now because It takes long time, Important questions

1. Why is data connection 1.85s
2. Why are there 11 Selects?
3. Why does each SELECT take 1s
4. Are they sequential?
5. Are they using indexes?
6. Is the database geographically far away?
7. Is the connection pool configured correctly?
8. Is Neon waking up?
9. Is there an N+1 query?
10. Are these queries unnecessarily repeated?

My Reason

1. I don't using indexes yet :)
2. I'm getting all the user data, Also information from different tables that related to that user. from table carts, orders, products, product_images. so i need to minimize the user payload returning only important info
3.

---

to save the trace

1- OpenSearch
2- ElasticSearch
3- Cassandra

**WorkOS/ Audit Logs** = Who did what
**OpenTelemetry** = trace/span/metrics
**Jaeger** = search/visualize/analyze
