"use client";

import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { BaseView } from './BaseView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { getDocumentation, listDocumentation } from '@/lib/api/client';

type DocListItem = { slug: string; title: string; category: string };
type DocDetail = DocListItem & { body: string };

function inlineParts(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(<code key={index} className="rounded bg-muted px-1 py-0.5 text-xs">{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link?.[2] ?? '#';
      const label = link?.[1] ?? token;
      if (href.startsWith('/') || href.startsWith('.')) {
        parts.push(<Link key={index} className="text-primary underline" href={href}>{label}</Link>);
      } else {
        parts.push(<a key={index} className="text-primary underline" href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
      }
    }
    last = index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\|?[\s:-]+(?:\|[\s:-]+)+\|?$/.test(line.trim());
}

function Markdown({ body }: { body: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = body.split('\n');
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push(<pre key={index} className="overflow-auto rounded bg-muted p-3 text-xs"><code>{code.join('\n')}</code></pre>);
      index += 1;
      continue;
    }
    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const tableLines: string[] = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const headers = parseTableRow(tableLines[0]);
      const rows = tableLines.slice(2).map(parseTableRow);
      blocks.push(
        <div key={index} className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                {headers.map((header, headerIndex) => (
                  <th key={headerIndex} className="border px-3 py-2 text-left font-semibold">
                    {inlineParts(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border px-3 py-2 align-top text-muted-foreground">
                      {inlineParts(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith('# ')) blocks.push(<h2 key={index} className="text-2xl font-semibold">{inlineParts(line.slice(2))}</h2>);
    else if (line.startsWith('## ')) blocks.push(<h3 key={index} className="text-lg font-semibold">{inlineParts(line.slice(3))}</h3>);
    else if (/^- /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^- /.test(lines[index])) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(<ul key={index} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineParts(item)}</li>)}</ul>);
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\. /, ''));
        index += 1;
      }
      blocks.push(<ol key={index} className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineParts(item)}</li>)}</ol>);
      continue;
    } else {
      blocks.push(<p key={index} className="text-sm leading-6 text-muted-foreground">{inlineParts(line)}</p>);
    }
    index += 1;
  }
  return <div className="space-y-4">{blocks}</div>;
}

export function DocumentationView() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<DocListItem[]>([]);
  const [selected, setSelected] = useState<DocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    listDocumentation(q).then((response) => {
      if (cancelled) return;
      const nextItems = response.data?.items ?? [];
      setItems(nextItems);
      const slug = selected?.slug && nextItems.some((item) => item.slug === selected.slug) ? selected.slug : nextItems[0]?.slug;
      if (!slug) {
        setSelected(null);
        return;
      }
      return getDocumentation(slug).then((detail) => {
        if (!cancelled) setSelected(detail.data?.doc ?? null);
      });
    }).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [q]);

  const selectDoc = (slug: string) => {
    setError(null);
    getDocumentation(slug).then((response) => setSelected(response.data?.doc ?? null)).catch((err: Error) => setError(err.message));
  };

  return (
    <BaseView title="Documentation" description="Browse BEE guides, specs, and references.">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <Input aria-label="Search documentation" placeholder="Search docs..." value={q} onChange={(event) => setQ(event.target.value)} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>Documentation Index</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <LoadingState message="Loading documentation index..." /> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {!isLoading && !error && !items.length ? <EmptyState title="No docs found" description="Try a different search." /> : null}
              {items.map((item) => (
                <button key={item.slug} type="button" onClick={() => selectDoc(item.slug)} className="block w-full rounded border px-3 py-2 text-left text-sm hover:bg-muted/30">
                  <span className="font-medium">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.category}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{selected?.title ?? 'Select a guide'}</CardTitle></CardHeader>
            <CardContent>
              {selected ? <Markdown body={selected.body} /> : <EmptyState title="No guide selected" description="Choose a documentation page from the index." />}
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseView>
  );
}
