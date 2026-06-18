import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfirmDialogCardProps {
  title: string;
  children: React.ReactNode;
}

export function ConfirmDialogCard({ title, children }: ConfirmDialogCardProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
