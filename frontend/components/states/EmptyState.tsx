interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ title = 'Nothing here yet', description = 'No data available for this section.' }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
