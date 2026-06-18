import { BaseView, type BaseViewProps } from './BaseView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CircleDot, Database, FileSliders, Flag, GitBranch, SlidersHorizontal, Sparkles, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WizardStepStatus = 'upcoming' | 'current' | 'completed';

export interface WizardStepMeta {
  label: string;
  description?: string;
  status: WizardStepStatus;
}

export interface WizardViewProps extends Omit<BaseViewProps, 'children'> {
  steps: WizardStepMeta[];
  children?: React.ReactNode;
  summary?: React.ReactNode;
  footer?: React.ReactNode;
}

function stepStatusClass(status: WizardStepStatus) {
  if (status === 'completed') return 'border-primary bg-primary text-primary-foreground shadow-[var(--glow-primary)]';
  if (status === 'current') return 'border-accent bg-accent text-accent-foreground shadow-[var(--glow-accent)]';
  return 'border-border bg-card text-muted-foreground';
}

function StepIcon({ label, status }: { label: string; status: WizardStepStatus }) {
  if (status === 'completed') return <Check className="h-4 w-4" />;

  const normalized = label.toLowerCase();
  const iconClass = "h-4 w-4";
  if (normalized.includes('dataset')) return <Database className={iconClass} />;
  if (normalized.includes('split')) return <GitBranch className={iconClass} />;
  if (normalized.includes('blueprint')) return <Zap className={iconClass} />;
  if (normalized.includes('target')) return <Target className={iconClass} />;
  if (normalized.includes('parameter')) return <SlidersHorizontal className={iconClass} />;
  if (normalized.includes('review')) return <Check className={iconClass} />;
  if (normalized.includes('submit')) return <Flag className={iconClass} />;
  if (normalized.includes('basic')) return <FileSliders className={iconClass} />;
  return status === 'current' ? <Sparkles className={iconClass} /> : <CircleDot className={iconClass} />;
}


export function WizardView({ steps, children, summary, footer, ...props }: WizardViewProps) {
  const currentIndex = steps.findIndex((step) => step.status === 'current');

  return (
    <BaseView {...props}>
      <div className="space-y-6">
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-gradient-card px-4 py-3">
          <div className="grid min-w-max items-start" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(7rem, 1fr))` }}>
            {steps.map((step, index) => (
              <div key={`${step.label}-${index}`} className="flex justify-center">
                <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      stepStatusClass(step.status),
                    )}
                  >
                    <StepIcon label={step.label} status={step.status} />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</p>
                    <p className={cn('max-w-28 text-xs font-semibold sm:text-sm', step.status === 'current' ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("grid gap-4", summary ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "lg:grid-cols-1")}>
          <Card>
            <CardHeader>
              <CardTitle>
                {currentIndex >= 0 ? `Step ${currentIndex + 1}: ${steps[currentIndex].label}` : 'Wizard'}
              </CardTitle>
              <CardDescription>
                {currentIndex >= 0 ? steps[currentIndex].description ?? 'Complete this step to continue.' : 'Follow the steps to proceed.'}
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>

          {summary ? (
            <Card className="h-fit lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>{summary}</CardContent>
            </Card>
          ) : null}
        </div>

        {footer ? (
          <div className="sticky bottom-3 z-10 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">{footer}</div>
          </div>
        ) : null}
      </div>
    </BaseView>
  );
}