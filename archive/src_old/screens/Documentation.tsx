"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, FileCode2, LineChart } from 'lucide-react';

const docs = [
  {
    title: 'Experiments',
    description: 'How experiment runs are configured, executed, and evaluated.',
    href: '/docs/Experiments',
    tag: 'Experiments',
    icon: FlaskConical,
  },
  {
    title: 'Indicators',
    description: 'Indicator catalog, categories, and implementation notes.',
    href: '/docs/Indicators',
    tag: 'Indicators',
    icon: LineChart,
  },
  {
    title: 'Blueprints',
    description: 'Blueprint structure, components, and governance flow.',
    href: '/docs/Blueprints',
    tag: 'Blueprints',
    icon: FileCode2,
  },
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="mt-1 text-muted-foreground">
            Browse core guides, specs, and references for BEE experiments.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.title} className="bg-gradient-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <doc.icon className="h-5 w-5" />
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{doc.tag}</Badge>
                </div>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={doc.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}