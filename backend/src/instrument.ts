import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://63a543e72b763ab40bec6252441327f7@o4510058158096384.ingest.de.sentry.io/4511187904364624",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  tracesSampleRate:1.0,
  sendDefaultPii:true,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});

