"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface RichMarkdownProps {
  content: string;
  className?: string;
}

function normalizeMarkdown(content: string) {
  return content.split(/(```[\s\S]*?```)/g).map((segment) => {
    if (segment.startsWith("```")) return segment;

    // Some providers omit a space after a bold label, producing cramped output
    // such as "**Strategy**Market entry". Keep the content intact but readable.
    return segment.replace(/(\*\*[^*\n]+\*\*)(?=[^\s.,:;!?\)\]}\n])/g, "$1 ");
  }).join("");
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border/80 bg-[#101116] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="font-mono text-[11px] font-medium text-muted-foreground">{language || "text"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "text"}
        PreTag="div"
        className="!m-0 !bg-transparent !p-3.5 !text-[12px] !leading-6 sm:!text-[13px]"
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function RichMarkdown({ content, className = "" }: RichMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`min-w-0 break-words text-[14px] leading-6 text-foreground sm:text-[15px] sm:leading-7 ${className}`}
      components={{
        h1: ({ children }) => <h1 className="mt-7 mb-3 text-xl font-semibold tracking-tight first:mt-0 sm:text-2xl">{children}</h1>,
        h2: ({ children }) => <h2 className="mt-6 mb-2.5 text-lg font-semibold tracking-tight first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-5 marker:text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-primary/70 bg-primary/[0.05] py-2 pl-4 pr-3 text-foreground/85">{children}</blockquote>,
        hr: () => <hr className="my-5 border-border" />,
        a: ({ children, ...props }) => <a className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary" target="_blank" rel="noreferrer" {...props}>{children}</a>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-[32rem] border-collapse text-left text-[13px] sm:text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/70 text-foreground">{children}</thead>,
        th: ({ children }) => <th className="border-b border-border px-3 py-2.5 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border-b border-border/60 px-3 py-2.5 align-top last:border-b-0">{children}</td>,
        tr: ({ children }) => <tr className="even:bg-muted/25">{children}</tr>,
        code({ inline, className, children }: any) {
          const language = /language-([^\s]+)/.exec(className || "")?.[1] || "";
          const value = String(children).replace(/\n$/, "");

          if (!inline) return <CodeBlock language={language} value={value} />;

          return <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.86em] text-foreground">{children}</code>;
        },
      }}
    >
      {normalizeMarkdown(content)}
    </ReactMarkdown>
  );
}
