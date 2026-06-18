interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}
