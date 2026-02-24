import React from 'react';

/**
 * Markdown-lite formatter for chat/community message bodies.
 * Processing order: code blocks -> inline code -> bold -> italic -> @mentions -> URLs
 *
 * Returns a React fragment with formatted JSX.
 */

const URL_RE = /https?:\/\/[^\s<]+[^\s<.,)]/g;
const MENTION_RE = /@(\w+)/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;
const ITALIC_RE = /\*(.+?)\*/g;

/* ------------------------------------------------------------------ */
/*  Inline formatting (bold, italic, @mentions, URLs)                 */
/* ------------------------------------------------------------------ */

function applyInlineFormatting(text, keyPrefix) {
  // We process by walking through the string and matching patterns in priority order.
  // Strategy: find the earliest match across all patterns, render text before it literally,
  // render the match formatted, then recurse on the remainder.

  const patterns = [
    {
      re: BOLD_RE,
      render: (match, key) => (
        <strong key={key} className="font-semibold text-parchment">
          {match[1]}
        </strong>
      ),
    },
    {
      re: ITALIC_RE,
      render: (match, key) => (
        <em key={key} className="italic">
          {match[1]}
        </em>
      ),
    },
    {
      re: MENTION_RE,
      render: (match, key) => (
        <span
          key={key}
          className="rounded-sm bg-[rgba(0,198,255,0.15)] px-1 text-[#00C6FF] font-medium"
        >
          {match[0]}
        </span>
      ),
    },
    {
      re: URL_RE,
      render: (match, key) => (
        <a
          key={key}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00C6FF] underline hover:text-[#00C6FF]/80"
        >
          {match[0]}
        </a>
      ),
    },
  ];

  const parts = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // Find the earliest match across all patterns
    let earliest = null;
    let earliestPattern = null;

    for (const pattern of patterns) {
      pattern.re.lastIndex = 0; // reset for each search
      const match = pattern.re.exec(remaining);
      if (match && (earliest === null || match.index < earliest.index)) {
        earliest = match;
        earliestPattern = pattern;
      }
    }

    if (!earliest) {
      // No more matches -- push the rest as plain text
      parts.push(remaining);
      break;
    }

    // Push text before the match
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    // Push the formatted element
    parts.push(earliestPattern.render(earliest, `${keyPrefix}-${idx}`));
    idx++;

    // Advance past the match
    remaining = remaining.slice(earliest.index + earliest[0].length);
  }

  return parts;
}

/* ------------------------------------------------------------------ */
/*  Inline code splitting (single backtick)                           */
/* ------------------------------------------------------------------ */

function processInlineCode(text, keyPrefix) {
  const parts = text.split(/(`[^`]+`)/g);
  const result = [];

  parts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      // Inline code
      result.push(
        <code
          key={`${keyPrefix}-ic-${i}`}
          className="rounded-sm bg-black/30 px-1 py-0.5 text-[11px] text-[#00C6FF] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.length > 0) {
      // Regular text -- apply inline formatting
      result.push(
        ...applyInlineFormatting(part, `${keyPrefix}-t-${i}`)
      );
    }
  });

  return result;
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function formatMessageBody(body) {
  if (!body) return null;

  // Step 1: Split on code blocks (triple backticks)
  // The regex captures the content between ``` markers (with optional language tag)
  const codeBlockRe = /```(?:\w*\n?)([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRe.exec(body)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: body.slice(lastIndex, match.index) });
    }
    // The code block content
    segments.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  if (lastIndex < body.length) {
    segments.push({ type: 'text', content: body.slice(lastIndex) });
  }

  // If no segments were produced (shouldn't happen with non-empty body, but safety)
  if (segments.length === 0) {
    segments.push({ type: 'text', content: body });
  }

  // Step 2 & 3: Render each segment
  const elements = segments.map((segment, segIdx) => {
    if (segment.type === 'code') {
      return (
        <pre
          key={`cb-${segIdx}`}
          className="my-1 rounded-sm bg-black/40 px-2 py-1.5 text-xs text-[#00C6FF] font-mono overflow-x-auto"
        >
          {segment.content}
        </pre>
      );
    }

    // Text segment: process inline code, then inline formatting
    return (
      <React.Fragment key={`seg-${segIdx}`}>
        {processInlineCode(segment.content, `s${segIdx}`)}
      </React.Fragment>
    );
  });

  return <>{elements}</>;
}
