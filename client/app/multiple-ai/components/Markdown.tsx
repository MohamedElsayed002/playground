"use client";

import React from "react";
import { CodeEditor } from "@/components/chategy/code-editor";
import { normalizeShikiLang } from "@/lib/utils";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split content by code blocks: ```lang\ncode\n```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-slate-200 text-sm md:text-base leading-relaxed break-words font-sans">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Extract language and code content
          const block = part.slice(3, -3);
          const firstNewlineIndex = block.indexOf("\n");
          let lang = "";
          let code = block;

          if (firstNewlineIndex !== -1) {
            lang = block.slice(0, firstNewlineIndex).trim();
            code = block.slice(firstNewlineIndex + 1);
          }

          const normalizedLang = normalizeShikiLang(lang) || "typescript";

          return (
            <div key={index} className="w-full my-4 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <CodeEditor
                lang={normalizedLang}
                title={lang || "code"}
                copyButton
                writing={false}
                className="w-full h-auto min-h-[12rem] max-h-[30rem]"
              >
                {code.trim()}
              </CodeEditor>
            </div>
          );
        } else {
          // Process standard text, headings, lists, bold text, and inline code
          return <TextSection key={index} text={part} />;
        }
      })}
    </div>
  );
}

function TextSection({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Process bullet list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed
            .split(/\n[-*]\s+/)
            .map((item) => item.replace(/^[-*]\s+/, ""));
          return (
            <ul key={pIdx} className="list-disc pl-6 space-y-1.5 my-2 text-slate-300">
              {items.map((item, iIdx) => (
                <li key={iIdx}>
                  <FormattedLine text={item} />
                </li>
              ))}
            </ul>
          );
        }

        // Process numbered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed
            .split(/\n\d+\.\s+/)
            .map((item) => item.replace(/^\d+\.\s+/, ""));
          return (
            <ol key={pIdx} className="list-decimal pl-6 space-y-1.5 my-2 text-slate-300">
              {items.map((item, iIdx) => (
                <li key={iIdx}>
                  <FormattedLine text={item} />
                </li>
              ))}
            </ol>
          );
        }

        // Process Headings
        if (trimmed.startsWith("#")) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const headingText = match[2];
            const baseClass = "font-bold text-white tracking-tight mt-6 mb-3";
            switch (level) {
              case 1:
                return <h1 key={pIdx} className={`${baseClass} text-2xl md:text-3xl border-b border-white/10 pb-2`}><FormattedLine text={headingText} /></h1>;
              case 2:
                return <h2 key={pIdx} className={`${baseClass} text-xl md:text-2xl border-b border-white/5 pb-1`}><FormattedLine text={headingText} /></h2>;
              case 3:
                return <h3 key={pIdx} className={`${baseClass} text-lg md:text-xl`}><FormattedLine text={headingText} /></h3>;
              default:
                return <h4 key={pIdx} className={`${baseClass} text-base md:text-lg`}><FormattedLine text={headingText} /></h4>;
            }
          }
        }

        // Standard paragraph
        return (
          <p key={pIdx} className="text-slate-300">
            <FormattedLine text={trimmed} />
          </p>
        );
      })}
    </>
  );
}

function FormattedLine({ text }: { text: string }) {
  // Regex to match inline code `code` or bold text **text**
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        } else if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-300 font-mono text-sm border border-slate-700/50"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}
