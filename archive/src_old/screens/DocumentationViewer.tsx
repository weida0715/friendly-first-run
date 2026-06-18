"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';

const docMetadata: Record<string, { title: string; description: string; tag: string }> = {
  Experiments: {
    title: 'Experiments',
    description: 'How experiment runs are configured, executed, and evaluated.',
    tag: 'Experiments',
  },
  Indicators: {
    title: 'Indicators',
    description: 'Indicator catalog, categories, and implementation notes.',
    tag: 'Indicators',
  },
  Blueprints: {
    title: 'Blueprints',
    description: 'Blueprint structure, components, and governance flow.',
    tag: 'Blueprints',
  },
};

export default function DocumentationViewer() {
  const params = useParams();
  const slug = useMemo(() => (params?.slug ? String(params.slug) : ''), [params?.slug]);
  const [content, setContent] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const docInfo = docMetadata[slug];

  useEffect(() => {
    if (!slug) return;

    const allowedDocs = new Set(['Experiments', 'Indicators', 'Blueprints']);
    if (!allowedDocs.has(slug)) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    fetch(`/docs/${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Doc not found');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setStatus('idle');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Documentation</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold">
              {docInfo?.title ?? slug.replace(/-/g, ' ')}
            </h1>
            {docInfo?.description && (
              <p className="mt-1 text-muted-foreground">{docInfo.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {docInfo?.tag && <Badge variant="secondary">{docInfo.tag}</Badge>}
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All docs
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-card">
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-6 text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
            {status === 'loading' && <p>Loading documentation...</p>}
            {status === 'error' && (
              <p className="text-destructive">Unable to load this documentation file.</p>
            )}
            {status === 'idle' && content && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}